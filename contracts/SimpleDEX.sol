// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SimpleDEX
 * @dev A simple decentralized exchange (DEX) contract allowing liquidity provision 
 * and token swaps between two ERC20 tokens.
 * @notice This implementation focuses on gas optimization while maintaining readability
 */
contract SimpleDEX {
    /// @dev Struct to pack pool-related variables together
    struct PoolInfo {
        uint256 tokenA;
        uint256 tokenB;
    }
    
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    address public immutable owner;
    PoolInfo public pool;

    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, uint256 swapType);
    event LiquidityAdded(address user, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address user, uint256 amountA, uint256 amountB);

    /**
     * @dev Restricts function access to contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "!own");
        _;
    }

    /**
     * @dev Sets up the DEX with two tokens
     * @param _tokenA Address of the first token
     * @param _tokenB Address of the second token
     */
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        owner = msg.sender;
        
        pool.tokenA = tokenA.balanceOf(address(this));
        pool.tokenB = tokenB.balanceOf(address(this));
    }

    /**
     * @dev Swaps token A for token B
     * @param amountAIn Amount of token A to swap
     * @notice Ensures constant product formula k = x * y
     */
    function swapAforB(uint256 amountAIn) external {
        require(amountAIn > 0, "!amt");
        
        address thisAddress = address(this);
        PoolInfo memory _pool = pool;
        
        uint256 amountBOut = getAmountOut(amountAIn, _pool.tokenA, _pool.tokenB);
        require(tokenB.balanceOf(thisAddress) >= amountBOut, "!liq");
        require(tokenA.allowance(msg.sender, thisAddress) >= amountAIn, "!alw");

        unchecked {
            _pool.tokenA += amountAIn;
            _pool.tokenB -= amountBOut;
        }
        
        pool = _pool;

        require(tokenA.transferFrom(msg.sender, thisAddress, amountAIn), "!trA");
        require(tokenB.transfer(msg.sender, amountBOut), "!trB");

        emit Swap(msg.sender, amountAIn, amountBOut, 1);
    }

    /**
     * @dev Swaps token B for token A
     * @param amountBIn Amount of token B to swap
     * @notice Ensures constant product formula k = x * y
     */
    function swapBforA(uint256 amountBIn) external {
        require(amountBIn > 0, "!amt");
        
        address thisAddress = address(this);
        PoolInfo memory _pool = pool;
        
        uint256 amountAOut = getAmountOut(amountBIn, _pool.tokenB, _pool.tokenA);
        require(tokenA.balanceOf(thisAddress) >= amountAOut, "!liq");

        unchecked {
            _pool.tokenB += amountBIn;
            _pool.tokenA -= amountAOut;
        }
        
        pool = _pool;

        require(tokenB.transferFrom(msg.sender, thisAddress, amountBIn), "!trB");
        require(tokenA.transfer(msg.sender, amountAOut), "!trA");

        emit Swap(msg.sender, amountBIn, amountAOut, 2);
    }

    /**
     * @dev Calculates the output amount based on constant product formula
     * @param amountIn Input amount
     * @param poolTokenIn Current pool balance of input token
     * @param poolTokenOut Current pool balance of output token
     * @return Amount of tokens to receive
     */
    function getAmountOut(
        uint256 amountIn, 
        uint256 poolTokenIn, 
        uint256 poolTokenOut
    ) internal pure returns (uint256) {
        require(poolTokenIn + amountIn > poolTokenIn, "!amt");
        
        unchecked {
            return poolTokenOut - ((poolTokenIn * poolTokenOut) / (poolTokenIn + amountIn));
        }
    }

    /**
     * @dev Gets the current price of a token in terms of the other token
     * @param _token Address of the token to price
     * @return Price with 18 decimals precision
     */
    function getPrice(address _token) external view returns (uint256) {
        require(_token == address(tokenA) || _token == address(tokenB), "!tkn");
        
        PoolInfo memory _pool = pool;
        require(_pool.tokenA > 0 && _pool.tokenB > 0, "!liq");

        unchecked {
            if (_token == address(tokenA)) {
                return (_pool.tokenB * 1e18) / _pool.tokenA;
            }
            return (_pool.tokenA * 1e18) / _pool.tokenB;
        }
    }

    /**
     * @dev Add liquidity to the pool
     * @param amountA Amount of Token A to add
     * @param amountB Amount of Token B to add
     * @notice Only owner can add liquidity
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "!amt");
        
        address thisAddress = address(this);
        PoolInfo memory _pool = pool;
        
        require(tokenA.allowance(msg.sender, thisAddress) >= amountA, "!alwA");
        require(tokenB.allowance(msg.sender, thisAddress) >= amountB, "!alwB");

        require(tokenA.transferFrom(msg.sender, thisAddress, amountA), "!trA");
        require(tokenB.transferFrom(msg.sender, thisAddress, amountB), "!trB");

        unchecked {
            _pool.tokenA += amountA;
            _pool.tokenB += amountB;
        }
        
        pool = _pool;

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    /**
     * @dev Remove liquidity from the pool
     * @param amountA Amount of Token A to remove
     * @param amountB Amount of Token B to remove
     * @notice Only owner can remove liquidity
     */
    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        PoolInfo memory _pool = pool;
        require(_pool.tokenA >= amountA && _pool.tokenB >= amountB, "!liq");

        address thisAddress = address(this);

        unchecked {
            _pool.tokenA -= amountA;
            _pool.tokenB -= amountB;
        }
        
        pool = _pool;

        require(tokenA.transfer(msg.sender, amountA), "!trA");
        require(tokenB.transfer(msg.sender, amountB), "!trB");

        emit LiquidityRemoved(msg.sender, amountA, amountB);
    }
}