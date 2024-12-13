import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTokenB: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("TokenB", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployTokenB;
deployTokenB.tags = ["TokenB"];
