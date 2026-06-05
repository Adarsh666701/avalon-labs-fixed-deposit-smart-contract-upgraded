// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInterestModel {
    function getRateBps(address asset, uint256 lockDuration) external view returns (uint256 aprBps);
}
