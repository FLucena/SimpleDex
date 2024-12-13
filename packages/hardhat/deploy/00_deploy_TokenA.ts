import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTokenA: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("TokenA", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployTokenA;
deployTokenA.tags = ["TokenA"];
