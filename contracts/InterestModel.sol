// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AccessController.sol";
import "./interfaces/IInterestModel.sol";

contract InterestModel is IInterestModel {
    uint256 public constant MAX_RATE_BPS = 5_000;

    AccessController public immutable accessController;

    mapping(address => mapping(uint256 => uint256)) private _ratesBps;

    event RateUpdated(address indexed asset, uint256 indexed lockDuration, uint256 aprBps);

    modifier onlyRateSetter() {
        require(
            accessController.hasRole(accessController.RATE_SETTER_ROLE(), msg.sender) ||
                accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "InterestModel: not authorized"
        );
        _;
    }

    constructor(address accessController_) {
        require(accessController_ != address(0), "InterestModel: zero access controller");
        accessController = AccessController(accessController_);
    }

    function setRateBps(address asset, uint256 lockDuration, uint256 aprBps) external onlyRateSetter {
        require(lockDuration > 0, "InterestModel: invalid duration");
        require(aprBps <= MAX_RATE_BPS, "InterestModel: rate too high");

        _ratesBps[asset][lockDuration] = aprBps;
        emit RateUpdated(asset, lockDuration, aprBps);
    }

    function getRateBps(address asset, uint256 lockDuration) external view override returns (uint256 aprBps) {
        aprBps = _ratesBps[asset][lockDuration];
        require(aprBps > 0, "InterestModel: rate not configured");
    }
}
