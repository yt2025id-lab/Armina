// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDRX
 * @notice Mock IDRX token for testing Armina platform
 * @dev This is a simple ERC20 token with minting capability for testnet
 */
contract IDRX is ERC20, Ownable {
    uint8 private constant DECIMALS = 18;

    constructor(uint256 initialSupply) ERC20("Indonesian Rupiah X", "IDRX") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Mint new tokens (only for testnet faucet)
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for testnet users
     * @dev Mints 10,000 IDRX to caller (can be called once per day)
     */
    function faucet() external {
        uint256 faucetAmount = 10000 * 10**DECIMALS; // 10,000 IDRX
        _mint(msg.sender, faucetAmount);
    }

    /**
     * @notice Get token decimals
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
}
