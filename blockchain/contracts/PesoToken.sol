// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Test Peso (tPHP)
/// @notice Play-money stand-in for pesos (1 tPHP = PHP 1). Testnet/local only, no real value.
/// @dev Only the owner (the app's relayer) can mint. This is not a token launch.
contract PesoToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Test Peso", "tPHP") Ownable(initialOwner) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
