// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AccessController.sol";

contract DepositNFT is ERC721 {
    AccessController public immutable accessController;
    address public manager;

    uint256 private _nextTokenId;

    event ManagerUpdated(address indexed previousManager, address indexed newManager);

    modifier onlyManager() {
        require(msg.sender == manager, "DepositNFT: not manager");
        _;
    }

    modifier onlyAdmin() {
        require(
            accessController.hasRole(accessController.ADMIN_ROLE(), msg.sender),
            "DepositNFT: not admin"
        );
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address accessController_,
        address manager_
    ) ERC721(name_, symbol_) {
        require(accessController_ != address(0), "DepositNFT: zero access controller");
        require(manager_ != address(0), "DepositNFT: zero manager");

        accessController = AccessController(accessController_);
        manager = manager_;
    }

    function setManager(address newManager) external onlyAdmin {
        require(newManager != address(0), "DepositNFT: zero manager");
        emit ManagerUpdated(manager, newManager);
        manager = newManager;
    }

    function mint(address to) external onlyManager returns (uint256 tokenId) {
        require(to != address(0), "DepositNFT: zero recipient");
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
    }

    function burn(uint256 tokenId) external onlyManager {
        _burn(tokenId);
    }
}
