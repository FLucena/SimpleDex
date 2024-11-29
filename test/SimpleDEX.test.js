const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDEX", function () {
  let token1, token2, dex, owner, user1, user2;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const USER_TOKENS = ethers.parseEther("1000");
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy tokens
    const Token1 = await ethers.getContractFactory("Token1");
    token1 = await Token1.deploy();
    await token1.waitForDeployment();

    const Token2 = await ethers.getContractFactory("Token2");
    token2 = await Token2.deploy();
    await token2.waitForDeployment();

    // Deploy DEX
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy(await token1.getAddress(), await token2.getAddress());
    await dex.waitForDeployment();

    // Mint tokens to DEX
    await token1.mint(await dex.getAddress(), INITIAL_SUPPLY);
    await token2.mint(await dex.getAddress(), INITIAL_SUPPLY);

    // Mint tokens to users
    await token1.mint(user1.address, USER_TOKENS);
    await token2.mint(user1.address, USER_TOKENS);
    await token1.mint(user2.address, USER_TOKENS);
    await token2.mint(user2.address, USER_TOKENS);
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await dex.token1()).to.equal(await token1.getAddress());
      expect(await dex.token2()).to.equal(await token2.getAddress());
    });

    it("Should have the correct initial balances", async function () {
      expect(await token1.balanceOf(await dex.getAddress())).to.equal(INITIAL_SUPPLY);
      expect(await token2.balanceOf(await dex.getAddress())).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Token Swaps", function () {
    it("Should swap token1 for token2", async function () {
      await token1.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      const beforeToken1 = await token1.balanceOf(user1.address);
      const beforeToken2 = await token2.balanceOf(user1.address);

      await dex.connect(user1).swap(
        await token1.getAddress(),
        await token2.getAddress(),
        SWAP_AMOUNT
      );

      expect(await token1.balanceOf(user1.address)).to.equal(beforeToken1 - SWAP_AMOUNT);
      expect(await token2.balanceOf(user1.address)).to.equal(beforeToken2 + SWAP_AMOUNT);
    });

    it("Should swap token2 for token1", async function () {
      await token2.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      const beforeToken1 = await token1.balanceOf(user1.address);
      const beforeToken2 = await token2.balanceOf(user1.address);

      await dex.connect(user1).swap(
        await token2.getAddress(),
        await token1.getAddress(),
        SWAP_AMOUNT
      );

      expect(await token2.balanceOf(user1.address)).to.equal(beforeToken2 - SWAP_AMOUNT);
      expect(await token1.balanceOf(user1.address)).to.equal(beforeToken1 + SWAP_AMOUNT);
    });

    it("Should emit Swap event", async function () {
      await token1.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      
      await expect(dex.connect(user1).swap(
        await token1.getAddress(),
        await token2.getAddress(),
        SWAP_AMOUNT
      )).to.emit(dex, "Swap")
        .withArgs(user1.address, await token1.getAddress(), await token2.getAddress(), SWAP_AMOUNT);
    });
  });

  describe("Error cases", function () {
    it("Should fail when swapping invalid tokens", async function () {
      await expect(dex.connect(user1).swap(
        ethers.ZeroAddress,
        await token2.getAddress(),
        SWAP_AMOUNT
      )).to.be.revertedWith("Invalid from token");
    });

    it("Should fail when swapping the same token", async function () {
      await expect(dex.connect(user1).swap(
        await token1.getAddress(),
        await token1.getAddress(),
        SWAP_AMOUNT
      )).to.be.revertedWith("Cannot swap same token");
    });

    it("Should fail when trying to swap without approval", async function () {
      await expect(dex.connect(user1).swap(
        await token1.getAddress(),
        await token2.getAddress(),
        SWAP_AMOUNT
      )).to.be.reverted;
    });

    it("Should fail when trying to swap more than balance", async function () {
      const largeAmount = ethers.parseEther("2000");
      await token1.connect(user1).approve(await dex.getAddress(), largeAmount);
      
      await expect(dex.connect(user1).swap(
        await token1.getAddress(),
        await token2.getAddress(),
        largeAmount
      )).to.be.reverted;
    });
  });

  describe("Multiple users", function () {
    it("Should handle multiple users swapping", async function () {
      // User1 swaps token1 for token2
      await token1.connect(user1).approve(await dex.getAddress(), SWAP_AMOUNT);
      await dex.connect(user1).swap(
        await token1.getAddress(),
        await token2.getAddress(),
        SWAP_AMOUNT
      );

      // User2 swaps token2 for token1
      await token2.connect(user2).approve(await dex.getAddress(), SWAP_AMOUNT);
      await dex.connect(user2).swap(
        await token2.getAddress(),
        await token1.getAddress(),
        SWAP_AMOUNT
      );

      // Check final balances
      expect(await token1.balanceOf(user1.address)).to.equal(USER_TOKENS - SWAP_AMOUNT);
      expect(await token2.balanceOf(user1.address)).to.equal(USER_TOKENS + SWAP_AMOUNT);
      expect(await token1.balanceOf(user2.address)).to.equal(USER_TOKENS + SWAP_AMOUNT);
      expect(await token2.balanceOf(user2.address)).to.equal(USER_TOKENS - SWAP_AMOUNT);
    });
  });
}); 