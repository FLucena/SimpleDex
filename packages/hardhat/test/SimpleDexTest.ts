import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleDEX, TokenA, TokenB } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleDEX", function () {
  let simpleDex: SimpleDEX;
  let tokenA: TokenA;
  let tokenB: TokenB;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const INITIAL_LIQUIDITY = ethers.parseEther("1000");

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy TokenA and TokenB
    const TokenAFactory = await ethers.getContractFactory("TokenA");
    tokenA = (await TokenAFactory.deploy()) as TokenA;
    await tokenA.waitForDeployment();

    const TokenBFactory = await ethers.getContractFactory("TokenB");
    tokenB = (await TokenBFactory.deploy()) as TokenB;
    await tokenB.waitForDeployment();

    // Deploy SimpleDEX
    const SimpleDEXFactory = await ethers.getContractFactory("SimpleDEX");
    simpleDex = (await SimpleDEXFactory.deploy(await tokenA.getAddress(), await tokenB.getAddress())) as SimpleDEX;
    await simpleDex.waitForDeployment();

    // Mint tokens to owner first
    await tokenA.mint(owner.address, INITIAL_SUPPLY * 3n); // Mint 3x supply to cover all users
    await tokenB.mint(owner.address, INITIAL_SUPPLY * 3n);

    // Transfer tokens to users for testing
    await tokenA.transfer(user1.address, INITIAL_SUPPLY);
    await tokenB.transfer(user1.address, INITIAL_SUPPLY);
    await tokenA.transfer(user2.address, INITIAL_SUPPLY);
    await tokenB.transfer(user2.address, INITIAL_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await simpleDex.tokenA()).to.equal(await tokenA.getAddress());
      expect(await simpleDex.tokenB()).to.equal(await tokenB.getAddress());
    });

    it("Should set the right owner", async function () {
      const contractOwner = await simpleDex.owner();
      expect(contractOwner).to.equal(owner.address);
    });
  });

  describe("Liquidity Operations", function () {
    it("Should add initial liquidity", async function () {
      // Approve tokens
      await tokenA.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);
      await tokenB.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);

      // Add liquidity
      await expect(simpleDex.addLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY))
        .to.emit(simpleDex, "LiquidityAdded")
        .withArgs(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);
    });

    it("Should remove liquidity", async function () {
      const amount = ethers.parseEther("100");
      await expect(simpleDex.removeLiquidity(amount, amount))
        .to.emit(simpleDex, "LiquidityRemoved")
        .withArgs(amount, amount);
    });

    it("Owner should be able to add initial liquidity", async function () {
      // Approve tokens first
      await tokenA.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);
      await tokenB.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);

      // Add liquidity
      await expect(simpleDex.addLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY))
        .to.emit(simpleDex, "LiquidityAdded")
        .withArgs(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);
    });
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      // Reset liquidity before each test
      await simpleDex.removeLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY).catch(() => {});

      // Add fresh liquidity using owner account
      await tokenA.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);
      await tokenB.approve(await simpleDex.getAddress(), INITIAL_LIQUIDITY);
      await simpleDex.addLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);
    });

    it("Should swap TokenA for TokenB with correct amounts", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user2).approve(await simpleDex.getAddress(), swapAmount);

      const beforeBalanceA = await tokenA.balanceOf(user2.address);
      const beforeBalanceB = await tokenB.balanceOf(user2.address);
      const beforeDexBalanceA = await tokenA.balanceOf(await simpleDex.getAddress());
      const beforeDexBalanceB = await tokenB.balanceOf(await simpleDex.getAddress());

      // Execute swap
      const tx = await simpleDex.connect(user2).swapAforB(swapAmount);

      const afterBalanceA = await tokenA.balanceOf(user2.address);
      const afterBalanceB = await tokenB.balanceOf(user2.address);
      const afterDexBalanceA = await tokenA.balanceOf(await simpleDex.getAddress());
      const afterDexBalanceB = await tokenB.balanceOf(await simpleDex.getAddress());

      // Check user balances changed correctly
      expect(beforeBalanceA - afterBalanceA).to.equal(swapAmount);
      expect(afterBalanceB).to.be.gt(beforeBalanceB); // Just verify it increased

      // Check DEX balances changed correctly
      expect(afterDexBalanceA - beforeDexBalanceA).to.equal(swapAmount);
      expect(beforeDexBalanceB).to.be.gt(afterDexBalanceB); // Just verify it decreased

      // Verify event emission
      await expect(tx)
        .to.emit(simpleDex, "TokenSwapped")
        .withArgs(user2.address, swapAmount, afterBalanceB - beforeBalanceB);
    });

    it("Should fail when trying to swap with insufficient allowance", async function () {
      const swapAmount = ethers.parseEther("10");

      // Explicitly set allowance to 0
      await tokenA.connect(user2).approve(await simpleDex.getAddress(), 0);

      // Try to swap without approval and check for specific error
      await expect(simpleDex.connect(user2).swapAforB(swapAmount))
        .to.be.revertedWithCustomError(tokenA, "ERC20InsufficientAllowance")
        .withArgs(await simpleDex.getAddress(), 0, swapAmount);
    });

    it("Should fail when trying to swap with insufficient balance", async function () {
      const hugeAmount = ethers.parseEther("1000000000");
      const userBalance = await tokenA.balanceOf(user2.address);

      await tokenA.connect(user2).approve(await simpleDex.getAddress(), hugeAmount);

      await expect(simpleDex.connect(user2).swapAforB(hugeAmount))
        .to.be.revertedWithCustomError(tokenA, "ERC20InsufficientBalance")
        .withArgs(user2.address, userBalance, hugeAmount);
    });

    it("Should fail when trying to swap zero amount", async function () {
      await expect(simpleDex.connect(user2).swapAforB(0)).to.be.revertedWith("Amount must be > 0");
    });

    it("Should maintain constant product after swap", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user2).approve(await simpleDex.getAddress(), swapAmount);

      const beforeDexBalanceA = BigInt(await tokenA.balanceOf(await simpleDex.getAddress()));
      const beforeDexBalanceB = BigInt(await tokenB.balanceOf(await simpleDex.getAddress()));
      const beforeProduct = beforeDexBalanceA * beforeDexBalanceB;

      await simpleDex.connect(user2).swapAforB(swapAmount);

      const afterDexBalanceA = BigInt(await tokenA.balanceOf(await simpleDex.getAddress()));
      const afterDexBalanceB = BigInt(await tokenB.balanceOf(await simpleDex.getAddress()));
      const afterProduct = afterDexBalanceA * afterDexBalanceB;

      // Allow for small rounding differences (convert to number for comparison)
      const difference = Number((beforeProduct - afterProduct) / beforeProduct);
      expect(Math.abs(difference)).to.be.lessThan(0.001); // Allow 0.1% difference
    });

    it("Should emit TokenSwapped event with correct values", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user1).approve(await simpleDex.getAddress(), swapAmount);

      // Calculate expected output amount
      const reserveA = await tokenA.balanceOf(await simpleDex.getAddress());
      const reserveB = await tokenB.balanceOf(await simpleDex.getAddress());
      const expectedOutput = (swapAmount * reserveB) / (reserveA + swapAmount);

      await expect(simpleDex.connect(user1).swapAforB(swapAmount))
        .to.emit(simpleDex, "TokenSwapped")
        .withArgs(user1.address, swapAmount, expectedOutput);
    });
  });

  describe("Price Checking", function () {
    it("Should return correct price for TokenA", async function () {
      const price = await simpleDex.getPrice(await tokenA.getAddress());
      expect(price).to.not.equal(0);
    });

    it("Should return correct price for TokenB", async function () {
      const price = await simpleDex.getPrice(await tokenB.getAddress());
      expect(price).to.not.equal(0);
    });

    it("Should revert for invalid token address", async function () {
      await expect(simpleDex.getPrice(ethers.ZeroAddress)).to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount swaps", async function () {
      await expect(simpleDex.connect(user2).swapAforB(0)).to.be.reverted;
    });

    it("Should handle zero liquidity additions", async function () {
      await expect(simpleDex.connect(user2).addLiquidity(0, 0)).to.be.reverted;
    });

    it("Should maintain correct reserves after multiple operations", async function () {
      const beforePrice = await simpleDex.getPrice(await tokenA.getAddress());

      // Perform multiple operations using owner account
      const amount = ethers.parseEther("10");
      await tokenA.approve(await simpleDex.getAddress(), amount);
      await tokenB.approve(await simpleDex.getAddress(), amount);
      await simpleDex.addLiquidity(amount, amount);

      await tokenA.connect(user2).approve(await simpleDex.getAddress(), amount);
      await simpleDex.connect(user2).swapAforB(amount);

      const afterPrice = await simpleDex.getPrice(await tokenA.getAddress());
      expect(afterPrice).to.not.equal(beforePrice);
    });
  });

  describe("Liquidity Management", function () {
    it("Should fail when removing more liquidity than available", async function () {
      // Get current balances
      const currentBalanceA = await tokenA.balanceOf(await simpleDex.getAddress());
      const currentBalanceB = await tokenB.balanceOf(await simpleDex.getAddress());

      // Try to remove more than available
      await expect(simpleDex.removeLiquidity(currentBalanceA + 1n, currentBalanceB)).to.be.revertedWith(
        "Low liquidity",
      );

      await expect(simpleDex.removeLiquidity(currentBalanceA, currentBalanceB + 1n)).to.be.revertedWith(
        "Low liquidity",
      );
    });

    it("Should track liquidity provider balances correctly", async function () {
      const amount = ethers.parseEther("50");

      const beforeBalanceA = await tokenA.balanceOf(owner.address);
      const beforeBalanceB = await tokenB.balanceOf(owner.address);

      await tokenA.approve(await simpleDex.getAddress(), amount);
      await tokenB.approve(await simpleDex.getAddress(), amount);
      await simpleDex.addLiquidity(amount, amount);

      const afterBalanceA = await tokenA.balanceOf(owner.address);
      const afterBalanceB = await tokenB.balanceOf(owner.address);

      expect(beforeBalanceA - afterBalanceA).to.equal(amount);
      expect(beforeBalanceB - afterBalanceB).to.equal(amount);
    });
  });

  describe("Price Oracle", function () {
    it("Should update price correctly after multiple swaps", async function () {
      const initialPrice = await simpleDex.getPrice(await tokenA.getAddress());

      // Perform multiple swaps
      const swapAmount = ethers.parseEther("10");
      for (let i = 0; i < 3; i++) {
        await tokenA.connect(user1).approve(await simpleDex.getAddress(), swapAmount);
        await simpleDex.connect(user1).swapAforB(swapAmount);
      }

      const finalPrice = await simpleDex.getPrice(await tokenA.getAddress());
      expect(finalPrice).to.not.equal(initialPrice);
    });

    it("Should maintain price consistency between tokens", async function () {
      const priceA = await simpleDex.getPrice(await tokenA.getAddress());
      const priceB = await simpleDex.getPrice(await tokenB.getAddress());

      // Price of A in terms of B * Price of B in terms of A should be close to 1e36 (considering 18 decimals twice)
      const product = (priceA * priceB) / BigInt(1e18);
      expect(product).to.be.closeTo(BigInt(1e18), BigInt(1e15)); // Allow 0.1% deviation
    });
  });
});
