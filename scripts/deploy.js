async function main() {
  console.log("Deploying contracts...");

  // Deploy Token1
  const Token1 = await ethers.getContractFactory("Token1");
  const token1 = await Token1.deploy();
  await token1.waitForDeployment();
  console.log("Token1 deployed to:", await token1.getAddress());

  // Deploy Token2
  const Token2 = await ethers.getContractFactory("Token2");
  const token2 = await Token2.deploy();
  await token2.waitForDeployment();
  console.log("Token2 deployed to:", await token2.getAddress());

  // Deploy SimpleDEX
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const simpleDEX = await SimpleDEX.deploy(
    await token1.getAddress(),
    await token2.getAddress()
  );
  await simpleDEX.waitForDeployment();
  console.log("SimpleDEX deployed to:", await simpleDEX.getAddress());

  // Mint some tokens to the DEX
  const dexAddress = await simpleDEX.getAddress();
  await token1.mint(dexAddress, ethers.parseEther("1000000"));
  await token2.mint(dexAddress, ethers.parseEther("1000000"));
  console.log("Tokens minted to DEX");

  console.log("Deployment complete!");
  
  // Log addresses for testing
  console.log("\nContract addresses for testing:");
  console.log("===============================");
  console.log("Token1:", await token1.getAddress());
  console.log("Token2:", await token2.getAddress());
  console.log("SimpleDEX:", await simpleDEX.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }); 