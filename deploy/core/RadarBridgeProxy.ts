import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'ethers';
import { loadConfig } from '../utils/config';

const fn: DeployFunction = async function (hre) {

    const {
        deployments: { deploy, get },
        ethers: { getSigners },
    } = hre;

  const deployer = (await getSigners())[0];
  const config = await loadConfig(hre);

  const RadarBridge = await get('RadarBridge');
  const initInterface = new ethers.utils.Interface(["function initialize(bytes32 _chain)"]);
  const constructorData = initInterface.encodeFunctionData("initialize", [ethers.utils.formatBytes32String(config.BridgeChainID)]);

  await deploy('RadarBridgeProxy', {
      from: deployer.address,
      args: [
          constructorData,
          RadarBridge.address
      ],
      log: true,
      skipIfAlreadyDeployed: false
  });
};

fn.tags = ['Core', 'RadarBridgeProxy'];
fn.dependencies = ['Config', 'RadarBridge'];
fn.skip = async (hre) => {
  // Skip this on non-core deployments
  const config = await loadConfig(hre);
  return config.DEPLOYMENT_TYPE != "CORE"
};

export default fn;
