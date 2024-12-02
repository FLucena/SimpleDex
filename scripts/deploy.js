async function main() {
  console.log("Deploying contracts...");

  // Deploy TokenA
  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();
  console.log("TokenA deployed to:", await tokenA.getAddress());

  // Deploy TokenB
  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy();
  await tokenB.waitForDeployment();
  console.log("TokenB deployed to:", await tokenB.getAddress());

  // Deploy SimpleDEX
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDEX = await SimpleDEX.deploy(
    await tokenA.getAddress(),
    await tokenB.getAddress()
  );
  await simpleDEX.waitForDeployment();
  console.log("SimpleDEX deployed to:", await simpleDEX.getAddress());

  // Mint some tokens to the DEX
  const dexAddress = await simpleDEX.getAddress();
  await tokenA.mint(dexAddress, ethers.parseEther("1000000"));
  await tokenB.mint(dexAddress, ethers.parseEther("1000000"));
  console.log("Tokens minted to DEX");

  console.log("Deployment complete!");
  
  // Log addresses for testing
  console.log("\nContract addresses for testing:");
  console.log("===============================");
  console.log("TokenA:", await tokenA.getAddress());
  console.log("TokenB:", await tokenB.getAddress());
  console.log("SimpleDEX:", await simpleDEX.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 