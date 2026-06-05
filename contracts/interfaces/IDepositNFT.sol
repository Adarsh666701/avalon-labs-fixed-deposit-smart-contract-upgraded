// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDepositNFT {
    function mint(address to) external returns (uint256 tokenId);
    function burn(uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address owner);
}
