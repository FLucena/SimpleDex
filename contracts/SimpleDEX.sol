// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEX {
    IERC20 public token1;
    IERC20 public token2;
    uint256 public rate = 1; // 1:1 exchange rate for simplicity

    event Swap(address indexed user, address fromToken, address toToken, uint256 amount);

    constructor(address _token1, address _token2) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
    }

    function swap(address fromToken, address toToken, uint256 amount) external {
        require(fromToken == address(token1) || fromToken == address(token2), "Invalid from token");
        require(toToken == address(token1) || toToken == address(token2), "Invalid to token");
        require(fromToken != toToken, "Cannot swap same token");
        
        IERC20(fromToken).transferFrom(msg.sender, address(this), amount);
        IERC20(toToken).transfer(msg.sender, amount * rate);
        
        emit Swap(msg.sender, fromToken, toToken, amount);
    }
} 