import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySimpleDex: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  const tokenA = await get("TokenA");
  const tokenB = await get("TokenB");

  await deploy("SimpleDEX", {
    from: deployer,
    args: [tokenA.address, tokenB.address],
    log: true,
    autoMine: true,
  });
};

export default deploySimpleDex;
deploySimpleDex.tags = ["SimpleDEX"];
deploySimpleDex.dependencies = ["TokenA", "TokenB"];
