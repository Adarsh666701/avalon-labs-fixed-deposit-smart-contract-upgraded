// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AccessController.sol";
import "./interfaces/ITreasury.sol";

contract Treasury is ITreasury, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    AccessController public immutable accessController;

    mapping(address => uint256) public liabilities;

    event LiabilityIncreased(address indexed asset, uint256 amount, uint256 totalLiability);
    event LiabilityDecreased(address indexed asset, uint256 amount, uint256 totalLiability);
    event Payout(address indexed asset, address indexed to, uint256 amount);
    event SurplusWithdrawn(address indexed asset, address indexed to, uint256 amount);
    event TokenFunded(address indexed asset, address indexed from, uint256 amount);

    modifier onlyManager() {
        require(
            accessController.hasRole(accessController.MANAGER_ROLE(), msg.sender),
            "Treasury: not manager"
        );
        _;
    }

    modifier onlyTreasuryManager() {
        require(
            accessController.hasRole(accessController.TREASURY_MANAGER_ROLE(), msg.sender) ||
                accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "Treasury: not treasury manager"
        );
        _;
    }

    modifier onlyPauser() {
        require(
            accessController.hasRole(accessController.PAUSER_ROLE(), msg.sender) ||
                accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "Treasury: not pauser"
        );
        _;
    }

    constructor(address accessController_) {
        require(accessController_ != address(0), "Treasury: zero access controller");
        accessController = AccessController(accessController_);
    }

    receive() external payable {}

    function fundToken(address asset, uint256 amount) external nonReentrant whenNotPaused {
        require(asset != address(0), "Treasury: invalid token");
        require(amount > 0, "Treasury: zero amount");

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        emit TokenFunded(asset, msg.sender, amount);
    }

    function increaseLiability(address asset, uint256 amount) external override onlyManager {
        require(amount > 0, "Treasury: zero amount");
        liabilities[asset] += amount;
        emit LiabilityIncreased(asset, amount, liabilities[asset]);
    }

    function decreaseLiability(address asset, uint256 amount) external override onlyManager {
        require(amount > 0, "Treasury: zero amount");
        require(liabilities[asset] >= amount, "Treasury: liability underflow");

        liabilities[asset] -= amount;
        emit LiabilityDecreased(asset, amount, liabilities[asset]);
    }

    function payout(address asset, address to, uint256 amount) external override onlyManager nonReentrant whenNotPaused {
        require(to != address(0), "Treasury: zero recipient");
        require(amount > 0, "Treasury: zero amount");
        require(assetBalance(asset) >= amount, "Treasury: insufficient balance");

        if (asset == address(0)) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "Treasury: ETH transfer failed");
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }

        emit Payout(asset, to, amount);
    }

    function withdrawSurplus(address asset, address to, uint256 amount) external onlyTreasuryManager nonReentrant {
        require(to != address(0), "Treasury: zero recipient");
        require(amount > 0, "Treasury: zero amount");
        require(amount <= availableReserves(asset), "Treasury: exceeds reserves");

        if (asset == address(0)) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "Treasury: ETH transfer failed");
        } else {
            IERC20(asset).safeTransfer(to, amount);
        }

        emit SurplusWithdrawn(asset, to, amount);
    }

    function pause() external onlyPauser {
        _pause();
    }

    function unpause() external onlyPauser {
        _unpause();
    }

    function assetBalance(address asset) public view override returns (uint256) {
        if (asset == address(0)) {
            return address(this).balance;
        }
        return IERC20(asset).balanceOf(address(this));
    }

    function availableReserves(address asset) public view override returns (uint256) {
        uint256 balance = assetBalance(asset);
        uint256 liability = liabilities[asset];

        if (balance <= liability) {
            return 0;
        }
        return balance - liability;
    }
}
