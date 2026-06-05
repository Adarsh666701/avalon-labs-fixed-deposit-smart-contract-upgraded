// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITreasury {
    function increaseLiability(address asset, uint256 amount) external;
    function decreaseLiability(address asset, uint256 amount) external;
    function payout(address asset, address to, uint256 amount) external;
    function assetBalance(address asset) external view returns (uint256);
    function availableReserves(address asset) external view returns (uint256);
}
