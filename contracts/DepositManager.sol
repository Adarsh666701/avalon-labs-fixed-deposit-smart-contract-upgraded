// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./AccessController.sol";
import "./interfaces/IDepositNFT.sol";
import "./interfaces/IInterestModel.sol";
import "./interfaces/ITreasury.sol";
import "./libraries/InterestMath.sol";

contract DepositManager is Initializable, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    uint256 public constant BASIS_POINTS = 10_000;

    struct DepositPosition {
        address asset;
        uint256 principal;
        uint256 startTime;
        uint256 maturityTime;
        uint256 aprBps;
        uint256 lockDuration;
        bool withdrawn;
    }

    struct WithdrawalWindow {
        uint256 windowStart;
        uint256 withdrawnAmount;
    }

    AccessController public accessController;
    IDepositNFT public depositNFT;
    IInterestModel public interestModel;
    ITreasury public treasury;

    mapping(uint256 => DepositPosition) public deposits;
    mapping(address => uint256) public minDeposit;
    mapping(address => uint256) public earlyWithdrawalPenaltyBps;
    mapping(address => uint256) public withdrawalLimitBps;
    mapping(address => WithdrawalWindow) public withdrawalWindows;
    mapping(address => uint256[]) private _userDeposits;

    uint256 public withdrawalWindowDuration;
    uint256 private _depositIdCounter;

    event DepositCreated(
        address indexed owner,
        uint256 indexed tokenId,
        address indexed asset,
        uint256 principal,
        uint256 aprBps,
        uint256 lockDuration,
        uint256 maturityTime
    );

    event DepositRedeemed(
        address indexed owner,
        uint256 indexed tokenId,
        address indexed asset,
        uint256 principal,
        uint256 interest,
        uint256 payout,
        uint256 penalty,
        bool matured
    );

    event MinDepositUpdated(address indexed asset, uint256 amount);
    event EarlyPenaltyUpdated(address indexed asset, uint256 penaltyBps);
    event WithdrawalLimitUpdated(address indexed asset, uint256 limitBps, uint256 windowDuration);
    event InterestModelUpdated(address indexed previousModel, address indexed newModel);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event DepositNFTUpdated(address indexed previousDepositNFT, address indexed newDepositNFT);

    modifier onlyAdmin() {
        require(
            accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "DepositManager: not admin"
        );
        _;
    }

    modifier onlyPauser() {
        require(
            accessController.hasRole(accessController.PAUSER_ROLE(), msg.sender) ||
                accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "DepositManager: not pauser"
        );
        _;
    }

    function initialize(
        address accessController_,
        address depositNFT_,
        address interestModel_,
        address treasury_
    ) external initializer {
        require(accessController_ != address(0), "DepositManager: zero access controller");
        require(depositNFT_ != address(0), "DepositManager: zero deposit nft");
        require(interestModel_ != address(0), "DepositManager: zero interest model");
        require(treasury_ != address(0), "DepositManager: zero treasury");

        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        accessController = AccessController(accessController_);
        depositNFT = IDepositNFT(depositNFT_);
        interestModel = IInterestModel(interestModel_);
        treasury = ITreasury(treasury_);

        withdrawalWindowDuration = 1 days;

        minDeposit[address(0)] = 0.01 ether;
        earlyWithdrawalPenaltyBps[address(0)] = 300;
        _depositIdCounter = 0;
    }

    function depositETH(uint256 lockDuration)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(msg.value >= minDeposit[address(0)], "DepositManager: below min deposit");

        tokenId = _createDeposit(msg.sender, address(0), msg.value, lockDuration);

        (bool ok, ) = payable(address(treasury)).call{value: msg.value}("");
        require(ok, "DepositManager: treasury transfer failed");
    }

    function depositToken(address asset, uint256 amount, uint256 lockDuration)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(asset != address(0), "DepositManager: invalid asset");
        require(amount >= minDeposit[asset], "DepositManager: below min deposit");

        IERC20(asset).safeTransferFrom(msg.sender, address(treasury), amount);
        tokenId = _createDeposit(msg.sender, asset, amount, lockDuration);
    }

    function redeem(uint256 tokenId) external nonReentrant whenNotPaused {
        require(depositNFT.ownerOf(tokenId) == msg.sender, "DepositManager: not nft owner");

        DepositPosition storage position = deposits[tokenId];
        require(!position.withdrawn, "DepositManager: already redeemed");

        uint256 interest = InterestMath.simpleInterest(position.principal, position.aprBps, position.lockDuration);
        uint256 fullLiability = position.principal + interest;

        bool matured = block.timestamp >= position.maturityTime;
        uint256 payout;
        uint256 penalty;

        if (matured) {
            payout = fullLiability;
        } else {
            uint256 penaltyBps = earlyWithdrawalPenaltyBps[position.asset];
            require(penaltyBps < BASIS_POINTS, "DepositManager: early withdrawal disabled");

            penalty = (position.principal * penaltyBps) / BASIS_POINTS;
            payout = position.principal - penalty;
        }

        _enforceWithdrawalRateLimit(position.asset, payout);

        position.withdrawn = true;
        treasury.decreaseLiability(position.asset, fullLiability);
        depositNFT.burn(tokenId);
        treasury.payout(position.asset, msg.sender, payout);

        emit DepositRedeemed(
            msg.sender,
            tokenId,
            position.asset,
            position.principal,
            interest,
            payout,
            penalty,
            matured
        );
    }

    function setMinDeposit(address asset, uint256 amount) external onlyAdmin {
        minDeposit[asset] = amount;
        emit MinDepositUpdated(asset, amount);
    }

    function setEarlyWithdrawalPenalty(address asset, uint256 penaltyBps) external onlyAdmin {
        require(penaltyBps <= BASIS_POINTS, "DepositManager: invalid penalty");
        earlyWithdrawalPenaltyBps[asset] = penaltyBps;
        emit EarlyPenaltyUpdated(asset, penaltyBps);
    }

    function setWithdrawalLimit(address asset, uint256 limitBps, uint256 windowDuration) external onlyAdmin {
        require(limitBps <= BASIS_POINTS, "DepositManager: invalid limit");
        require(windowDuration > 0, "DepositManager: invalid window");

        withdrawalLimitBps[asset] = limitBps;
        withdrawalWindowDuration = windowDuration;

        emit WithdrawalLimitUpdated(asset, limitBps, windowDuration);
    }

    function setInterestModel(address newModel) external onlyAdmin {
        require(newModel != address(0), "DepositManager: zero interest model");
        emit InterestModelUpdated(address(interestModel), newModel);
        interestModel = IInterestModel(newModel);
    }

    function setTreasury(address newTreasury) external onlyAdmin {
        require(newTreasury != address(0), "DepositManager: zero treasury");
        emit TreasuryUpdated(address(treasury), newTreasury);
        treasury = ITreasury(newTreasury);
    }

    function setDepositNFT(address newDepositNFT) external onlyAdmin {
        require(newDepositNFT != address(0), "DepositManager: zero deposit nft");
        emit DepositNFTUpdated(address(depositNFT), newDepositNFT);
        depositNFT = IDepositNFT(newDepositNFT);
    }

    function pause() external onlyPauser {
        _pause();
    }

    function unpause() external onlyPauser {
        _unpause();
    }

    function expectedPayout(uint256 tokenId)
        external
        view
        returns (uint256 principal, uint256 interest, uint256 maturityPayout)
    {
        DepositPosition memory position = deposits[tokenId];
        principal = position.principal;
        interest = InterestMath.simpleInterest(position.principal, position.aprBps, position.lockDuration);
        maturityPayout = principal + interest;
    }

    /// ─────────────────────────────────────────────────
    ///  Portfolio Dashboard Functions
    /// ─────────────────────────────────────────────────

    struct PortfolioPosition {
        uint256 tokenId;
        address asset;
        uint256 principal;
        uint256 accruedInterest;
        uint256 expectedMaturityAmount;
        uint256 maturityTime;
        bool matured;
        bool withdrawn;
        uint256 claimableAmount;
    }

    struct PortfolioSummary {
        uint256 totalActivePositions;
        uint256 totalPrincipalLocked;
        uint256 totalAccruedInterest;
        uint256 totalClaimable;
    }

    /// @notice Get all active positions for a user (requires NFT ownership check)
    function getUserActivePositions(address user) external view returns (PortfolioPosition[] memory) {
        uint256[] memory userTokenIds = _userDeposits[user];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < userTokenIds.length; i++) {
            if (!deposits[userTokenIds[i]].withdrawn) {
                activeCount++;
            }
        }

        PortfolioPosition[] memory positions = new PortfolioPosition[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < userTokenIds.length; i++) {
            uint256 tokenId = userTokenIds[i];
            if (!deposits[tokenId].withdrawn) {
                DepositPosition memory pos = deposits[tokenId];
                uint256 interest = InterestMath.simpleInterest(pos.principal, pos.aprBps, pos.lockDuration);
                bool hasMatured = block.timestamp >= pos.maturityTime;
                uint256 claimable = hasMatured ? (pos.principal + interest) : 0;

                positions[index] = PortfolioPosition({
                    tokenId: tokenId,
                    asset: pos.asset,
                    principal: pos.principal,
                    accruedInterest: interest,
                    expectedMaturityAmount: pos.principal + interest,
                    maturityTime: pos.maturityTime,
                    matured: hasMatured,
                    withdrawn: pos.withdrawn,
                    claimableAmount: claimable
                });
                index++;
            }
        }

        return positions;
    }

    /// @notice Get deposit history (all positions, including withdrawn)
    function getUserDepositHistory(address user) external view returns (PortfolioPosition[] memory) {
        uint256[] memory userTokenIds = _userDeposits[user];
        PortfolioPosition[] memory positions = new PortfolioPosition[](userTokenIds.length);

        for (uint256 i = 0; i < userTokenIds.length; i++) {
            uint256 tokenId = userTokenIds[i];
            DepositPosition memory pos = deposits[tokenId];
            uint256 interest = InterestMath.simpleInterest(pos.principal, pos.aprBps, pos.lockDuration);
            bool hasMatured = block.timestamp >= pos.maturityTime;
            uint256 claimable = hasMatured && !pos.withdrawn ? (pos.principal + interest) : 0;

            positions[i] = PortfolioPosition({
                tokenId: tokenId,
                asset: pos.asset,
                principal: pos.principal,
                accruedInterest: interest,
                expectedMaturityAmount: pos.principal + interest,
                maturityTime: pos.maturityTime,
                matured: hasMatured,
                withdrawn: pos.withdrawn,
                claimableAmount: claimable
            });
        }

        return positions;
    }

    /// @notice Get aggregated portfolio metrics
    function getUserPortfolioSummary(address user) external view returns (PortfolioSummary memory summary) {
        uint256[] memory userTokenIds = _userDeposits[user];
        uint256 totalPrincipal = 0;
        uint256 totalInterest = 0;
        uint256 totalClaimable = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < userTokenIds.length; i++) {
            uint256 tokenId = userTokenIds[i];
            if (!deposits[tokenId].withdrawn) {
                DepositPosition memory pos = deposits[tokenId];
                uint256 interest = InterestMath.simpleInterest(pos.principal, pos.aprBps, pos.lockDuration);
                totalPrincipal += pos.principal;
                totalInterest += interest;

                if (block.timestamp >= pos.maturityTime) {
                    totalClaimable += pos.principal + interest;
                }

                activeCount++;
            }
        }

        return PortfolioSummary({
            totalActivePositions: activeCount,
            totalPrincipalLocked: totalPrincipal,
            totalAccruedInterest: totalInterest,
            totalClaimable: totalClaimable
        });
    }
    /// @notice Get accrued interest for a specific deposit
    function getAccruedInterest(uint256 tokenId) external view returns (uint256 interest) {
        DepositPosition memory position = deposits[tokenId];
        interest = InterestMath.simpleInterest(position.principal, position.aprBps, position.lockDuration);
    }

    /// @notice Get claimable amount for a specific deposit
    function getClaimableAmount(uint256 tokenId) external view returns (uint256 claimable) {
        DepositPosition memory position = deposits[tokenId];
        require(!position.withdrawn, "DepositManager: already withdrawn");

        uint256 interest = InterestMath.simpleInterest(position.principal, position.aprBps, position.lockDuration);

        if (block.timestamp >= position.maturityTime) {
            claimable = position.principal + interest;
        } else {
            uint256 penaltyBps = earlyWithdrawalPenaltyBps[position.asset];
            if (penaltyBps < BASIS_POINTS) {
                uint256 penalty = (position.principal * penaltyBps) / BASIS_POINTS;
                claimable = position.principal - penalty;
            }
        }
    }

    /// @notice Get time remaining until maturity in seconds (0 if already matured)
    function getTimeUntilMaturity(uint256 tokenId) external view returns (uint256 timeRemaining) {
        DepositPosition memory position = deposits[tokenId];
        if (block.timestamp >= position.maturityTime) {
            timeRemaining = 0;
        } else {
            timeRemaining = position.maturityTime - block.timestamp;
        }
    }

    /// ─────────────────────────────────────────────────
    ///  Internal Helper Functions
    /// ─────────────────────────────────────────────────

    function _getNextDepositId() internal view returns (uint256) {
        return _depositIdCounter + 1;
    }
    function _createDeposit(
        address owner,
        address asset,
        uint256 amount,
        uint256 lockDuration
    ) internal returns (uint256 tokenId) {
        require(amount > 0, "DepositManager: zero amount");
        require(lockDuration > 0, "DepositManager: invalid lock duration");

        uint256 aprBps = interestModel.getRateBps(asset, lockDuration);
        uint256 expectedInterest = InterestMath.simpleInterest(amount, aprBps, lockDuration);

        tokenId = depositNFT.mint(owner);
        deposits[tokenId] = DepositPosition({
            asset: asset,
            principal: amount,
            startTime: block.timestamp,
            maturityTime: block.timestamp + lockDuration,
            aprBps: aprBps,
            lockDuration: lockDuration,
            withdrawn: false
        });

        _userDeposits[owner].push(tokenId);
        _depositIdCounter++;
        treasury.increaseLiability(asset, amount + expectedInterest);

        emit DepositCreated(
            owner,
            tokenId,
            asset,
            amount,
            aprBps,
            lockDuration,
            block.timestamp + lockDuration
        );
    }

    function _enforceWithdrawalRateLimit(address asset, uint256 payoutAmount) internal {
        uint256 limitBps = withdrawalLimitBps[asset];
        if (limitBps == 0) {
            return;
        }

        WithdrawalWindow storage window = withdrawalWindows[asset];
        if (window.windowStart == 0 || block.timestamp > window.windowStart + withdrawalWindowDuration) {
            window.windowStart = block.timestamp;
            window.withdrawnAmount = 0;
        }

        uint256 balance = treasury.assetBalance(asset);
        uint256 maxAllowed = (balance * limitBps) / BASIS_POINTS;
        require(maxAllowed > 0, "DepositManager: withdrawal limit zero");
        require(window.withdrawnAmount + payoutAmount <= maxAllowed, "DepositManager: withdrawal limit reached");

        window.withdrawnAmount += payoutAmount;
    }

    function _authorizeUpgrade(address) internal  view override {
        require(
            accessController.hasRole(accessController.UPGRADER_ROLE(), msg.sender),
            "DepositManager: not upgrader"
        );
    }
}
