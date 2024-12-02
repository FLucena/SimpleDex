const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("SimpleDEX", function () {
  let tokenA, tokenB, dex, owner, user1, user2;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const USER_TOKENS = ethers.parseEther("1000");
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const TokenA = await ethers.getContractFactory("TokenA");
    tokenA = await TokenA.deploy();
    await tokenA.waitForDeployment();

    const TokenB = await ethers.getContractFactory("TokenB");
    tokenB = await TokenB.deploy();
    await tokenB.waitForDeployment();

    // Deploy DEX
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    await dex.waitForDeployment();

    // Mint tokens to owner for liquidity
    await tokenA.mint(owner.address, INITIAL_SUPPLY);
    await tokenB.mint(owner.address, INITIAL_SUPPLY);

    // Add initial liquidity
    await tokenA.connect(owner).approve(await dex.getAddress(), INITIAL_SUPPLY);
    await tokenB.connect(owner).approve(await dex.getAddress(), INITIAL_SUPPLY);
    await dex.connect(owner).addLiquidity(INITIAL_SUPPLY, INITIAL_SUPPLY);

    // Mint tokens to users
    await tokenA.mint(user1.address, USER_TOKENS);
    await tokenB.mint(user1.address, USER_TOKENS);
    await tokenA.mint(user2.address, USER_TOKENS);
    await tokenB.mint(user2.address, USER_TOKENS);
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await dex.tokenA()).to.equal(await tokenA.getAddress());
      expect(await dex.tokenB()).to.equal(await tokenB.getAddress());
    });

    it("Should have the correct initial balances", async function () {
      const pool = await dex.pool();
      expect(pool.tokenA).to.equal(INITIAL_SUPPLY);
      expect(pool.tokenB).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct owner", async function () {
      expect(await dex.owner()).to.equal(owner.address);
    });
  });

  describe("Token Swaps", function () {
    it("Should swap tokenA for tokenB", async function () {
      await tokenA.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      const beforeTokenA = await tokenA.balanceOf(user1.address);
      const beforeTokenB = await tokenB.balanceOf(user1.address);

      await dex.connect(user1).swapAforB(SWAP_AMOUNT);

      const afterTokenA = await tokenA.balanceOf(user1.address);
      const afterTokenB = await tokenB.balanceOf(user1.address);

      expect(beforeTokenA - afterTokenA).to.equal(SWAP_AMOUNT);
      expect(afterTokenB).to.be.gt(beforeTokenB);
    });

    it("Should swap tokenB for tokenA", async function () {
      await tokenB.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      const beforeTokenA = await tokenA.balanceOf(user1.address);
      const beforeTokenB = await tokenB.balanceOf(user1.address);

      await dex.connect(user1).swapBforA(SWAP_AMOUNT);

      const afterTokenA = await tokenA.balanceOf(user1.address);
      const afterTokenB = await tokenB.balanceOf(user1.address);

      expect(beforeTokenB - afterTokenB).to.equal(SWAP_AMOUNT);
      expect(afterTokenA).to.be.gt(beforeTokenA);
    });

    it("Should emit Swap event", async function () {
      await tokenA.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      await expect(dex.connect(user1).swapAforB(SWAP_AMOUNT))
        .to.emit(dex, "Swap")
        .withArgs(
          user1.address,    // user
          SWAP_AMOUNT,      // amountIn
          anyValue,         // amountOut (can be any value)
          1n                // swapType (1 for A to B)
        );
    });
  });

  describe("Liquidity Management", function () {
    const LIQUIDITY_AMOUNT = ethers.parseEther("1000");

    beforeEach(async function () {
      // Mint additional tokens to owner for liquidity tests
      await tokenA.mint(owner.address, LIQUIDITY_AMOUNT);
      await tokenB.mint(owner.address, LIQUIDITY_AMOUNT);
    });

    it("Should allow owner to add liquidity", async function () {
      await tokenA.connect(owner).approve(await dex.getAddress(), LIQUIDITY_AMOUNT);
      await tokenB.connect(owner).approve(await dex.getAddress(), LIQUIDITY_AMOUNT);

      await expect(dex.connect(owner).addLiquidity(LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT))
        .to.emit(dex, "LiquidityAdded")
        .withArgs(owner.address, LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT);
    });

    it("Should allow owner to remove liquidity", async function () {
      const REMOVE_AMOUNT = ethers.parseEther("100");
      
      await expect(dex.connect(owner).removeLiquidity(REMOVE_AMOUNT, REMOVE_AMOUNT))
        .to.emit(dex, "LiquidityRemoved")
        .withArgs(owner.address, REMOVE_AMOUNT, REMOVE_AMOUNT);
    });

    it("Should not allow non-owner to add liquidity", async function () {
      await expect(dex.connect(user1).addLiquidity(LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT))
        .to.be.revertedWith("!own");
    });

    it("Should not allow non-owner to remove liquidity", async function () {
      await expect(dex.connect(user1).removeLiquidity(LIQUIDITY_AMOUNT, LIQUIDITY_AMOUNT))
        .to.be.revertedWith("!own");
    });
  });

  describe("Price Oracle", function () {
    it("Should return correct price for tokenA", async function () {
      const price = await dex.getPrice(await tokenA.getAddress());
      expect(price).to.equal(ethers.parseEther("1")); // Initial price should be 1:1
    });

    it("Should return correct price for tokenB", async function () {
      const price = await dex.getPrice(await tokenB.getAddress());
      expect(price).to.equal(ethers.parseEther("1")); // Initial price should be 1:1
    });

    it("Should revert for invalid token", async function () {
      await expect(dex.getPrice(ethers.ZeroAddress)).to.be.revertedWith("!tkn");
    });
  });

  describe("Error cases", function () {
    it("Should fail when swapping with zero amount", async function () {
      await expect(dex.connect(user1).swapAforB(0)).to.be.revertedWith("!amt");
      await expect(dex.connect(user1).swapBforA(0)).to.be.revertedWith("!amt");
    });

    it("Should fail when swapping without approval", async function () {
      await expect(dex.connect(user1).swapAforB(SWAP_AMOUNT)).to.be.revertedWith("!alw");
    });

    it("Should fail when trying to swap more than balance", async function () {
      const largeAmount = ethers.parseEther("2000");
      await tokenA.connect(user1).approve(await dex.getAddress(), largeAmount);
      
      await expect(dex.connect(user1).swapAforB(largeAmount))
        .to.be.reverted;
    });
  });
}); 