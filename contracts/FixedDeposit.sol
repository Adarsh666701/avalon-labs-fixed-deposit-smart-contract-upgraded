// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FixedDeposit
 * @author Avalon Labs
 * @notice A decentralized fixed deposit protocol where users can lock ETH
 *         for defined periods and earn interest.
 *
 * Lock Periods & APR:
 *  - 30  days → 5%  APR
 *  - 90  days → 8%  APR
 *  - 180 days → 12% APR
 *
 * Security:
 *  - ReentrancyGuard pattern (mutex lock)
 *  - Checks-Effects-Interactions ordering
 *  - No early withdrawals enforced on-chain
 *  - Owner-only reserve top-up for interest payments
 */
contract FixedDeposit {

    uint256 public constant MIN_DEPOSIT      = 0.01 ether;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Lock period durations in seconds
    uint256 public constant PERIOD_30_DAYS  = 30 days;
    uint256 public constant PERIOD_90_DAYS  = 90 days;
    uint256 public constant PERIOD_180_DAYS = 180 days;

    // APR in basis points (1 bp = 0.01%)
    uint256 public constant APR_30_DAYS  = 500;   // 5%
    uint256 public constant APR_90_DAYS  = 800;   // 8%
    uint256 public constant APR_180_DAYS = 1200;  // 12%

    uint256 private constant BASIS_POINTS = 10_000;

    // ─────────────────────────────────────────────────
    //  State
    // ─────────────────────────────────────────────────

    address public immutable owner;

    // Reentrancy guard
    bool private _locked;

    /// @dev Deposit record per user per deposit index
    struct DepositRecord {
        uint256 principal;       // ETH deposited (wei)
        uint256 startTime;       // block.timestamp at deposit
        uint256 maturityTime;    // startTime + lock duration
        uint256 aprBps;          // APR in basis points
        uint256 lockDuration;    // lock period in seconds
        bool    withdrawn;       // true once claimed
    }

    /// @dev depositId → deposit record
    mapping(uint256 => DepositRecord) private _deposits;

    /// @dev user address → list of deposit IDs
    mapping(address => uint256[]) private _userDeposits;

    /// @dev depositId → owner address (reverse lookup)
    mapping(uint256 => address) private _depositOwner;

    uint256 private _nextDepositId;

    // ─────────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────────

    event Deposited(
        address indexed user,
        uint256 indexed depositId,
        uint256 principal,
        uint256 lockDuration,
        uint256 aprBps,
        uint256 maturityTime
    );

    event Withdrawn(
        address indexed user,
        uint256 indexed depositId,
        uint256 principal,
        uint256 interest,
        uint256 total
    );

    event ReserveFunded(address indexed funder, uint256 amount);

    //  Modifiers

    modifier onlyOwner() {
        require(msg.sender == owner, "FixedDeposit: caller is not owner");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "FixedDeposit: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    //  Constructor

    constructor() payable {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────
    //  External: User Functions
    // ─────────────────────────────────────────────────

    /**
     * @notice Deposit ETH into a fixed-term deposit.
     * @param lockDuration Must be exactly 30, 90, or 180 days (in seconds).
     *
     * Requirements:
     *  - msg.value >= MIN_DEPOSIT (0.01 ETH)
     *  - lockDuration is one of the three allowed values
     */
    function deposit(uint256 lockDuration) external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT, "FixedDeposit: below minimum deposit");

        uint256 aprBps = _aprForDuration(lockDuration);

        uint256 depositId = _nextDepositId++;
        uint256 maturityTime = block.timestamp + lockDuration;

        // Effects
        _deposits[depositId] = DepositRecord({
            principal:    msg.value,
            startTime:    block.timestamp,
            maturityTime: maturityTime,
            aprBps:       aprBps,
            lockDuration: lockDuration,
            withdrawn:    false
        });
        _userDeposits[msg.sender].push(depositId);
        _depositOwner[depositId] = msg.sender;

        emit Deposited(
            msg.sender,
            depositId,
            msg.value,
            lockDuration,
            aprBps,
            maturityTime
        );
    }
    /**
     * @notice Withdraw principal + interest after maturity.
     * @param depositId The ID of the deposit to withdraw.
     *
     * Requirements:
     *  - Caller must be the deposit owner
     *  - Deposit must not have been previously withdrawn
     *  - Current time must be >= maturityTime (no early withdrawals)
     *  - Contract must hold enough ETH to cover interest
     */
    function withdraw(uint256 depositId) external nonReentrant {
        require(_depositOwner[depositId] == msg.sender, "FixedDeposit: not deposit owner");

        DepositRecord storage rec = _deposits[depositId];

        require(!rec.withdrawn,                        "FixedDeposit: already withdrawn");
        require(block.timestamp >= rec.maturityTime,   "FixedDeposit: deposit not matured");

        uint256 interest = calculateInterest(
            rec.principal,
            rec.aprBps,
            rec.lockDuration
        );
        uint256 total = rec.principal + interest;

        require(address(this).balance >= total, "FixedDeposit: insufficient reserve for interest");

        // Effects before interaction (CEI pattern)
        rec.withdrawn = true;

        emit Withdrawn(msg.sender, depositId, rec.principal, interest, total);

        // Interaction
        (bool success, ) = payable(msg.sender).call{value: total}("");
        require(success, "FixedDeposit: ETH transfer failed");
    }

    // ─────────────────────────────────────────────────
    //  External: Owner Functions
    // ─────────────────────────────────────────────────

    /**
     * @notice Fund the contract reserve to cover future interest payouts.
     */
    function fundReserve() external payable onlyOwner {
        require(msg.value > 0, "FixedDeposit: must send ETH");
        emit ReserveFunded(msg.sender, msg.value);
    }

    // Allow plain ETH sends from owner
    receive() external payable {
        require(msg.sender == owner, "FixedDeposit: only owner can top-up");
        emit ReserveFunded(msg.sender, msg.value);
    }

    // ─────────────────────────────────────────────────
    //  View Functions
    // ─────────────────────────────────────────────────

    /**
     * @notice Returns all deposit IDs belonging to a user.
     */
    function getUserDepositIds(address user) external view returns (uint256[] memory) {
        return _userDeposits[user];
    }

    /**
     * @notice Returns the full details of a deposit.
     */
    function getDeposit(uint256 depositId)
        external
        view
        returns (
            address depositor,
            uint256 principal,
            uint256 startTime,
            uint256 maturityTime,
            uint256 aprBps,
            uint256 lockDuration,
            bool    withdrawn,
            uint256 expectedInterest,
            uint256 expectedTotal
        )
    {
        DepositRecord storage rec = _deposits[depositId];
        depositor       = _depositOwner[depositId];
        principal       = rec.principal;
        startTime       = rec.startTime;
        maturityTime    = rec.maturityTime;
        aprBps          = rec.aprBps;
        lockDuration    = rec.lockDuration;
        withdrawn       = rec.withdrawn;
        expectedInterest = calculateInterest(rec.principal, rec.aprBps, rec.lockDuration);
        expectedTotal    = principal + expectedInterest;
    }

    /**
     * @notice Check if a deposit has matured.
     */
    function isMatured(uint256 depositId) external view returns (bool) {
        return block.timestamp >= _deposits[depositId].maturityTime;
    }

    /**
     * @notice Total number of deposits ever created.
     */
    function totalDeposits() external view returns (uint256) {
        return _nextDepositId;
    }

    /**
     * @notice Current contract reserve balance.
     */
    function reserveBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─────────────────────────────────────────────────
    //  Pure / Internal Helpers
    // ─────────────────────────────────────────────────

    /**
     * @notice Calculate simple interest for a deposit.
     * @dev    interest = principal * APR(bps) * lockDuration / (SECONDS_PER_YEAR * BASIS_POINTS)
     */
    function calculateInterest(
        uint256 principal,
        uint256 aprBps,
        uint256 lockDuration
    ) public pure returns (uint256) {
        return (principal * aprBps * lockDuration) / (SECONDS_PER_YEAR * BASIS_POINTS);
    }

    /**
     * @dev Maps a lock duration to its APR in basis points.
     *      Reverts if the duration is not one of the three allowed values.
     */
    function _aprForDuration(uint256 lockDuration) internal pure returns (uint256) {
        if (lockDuration == PERIOD_30_DAYS)  return APR_30_DAYS;
        if (lockDuration == PERIOD_90_DAYS)  return APR_90_DAYS;
        if (lockDuration == PERIOD_180_DAYS) return APR_180_DAYS;
        revert("FixedDeposit: invalid lock duration");
    }
}
