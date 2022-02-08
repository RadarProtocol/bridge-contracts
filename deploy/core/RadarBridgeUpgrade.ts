import { DeployFunction } from 'hardhat-deploy/types';

import { loadConfig } from '../utils/config';

const fn: DeployFunction = async function (hre) {

    const {
        deployments: { deploy, get, log },
        ethers: { getSigners },
    } = hre;

  const deployer = (await getSigners())[0];
  const config = await loadConfig(hre);
  
  await deploy('RadarBridge', {
      from: deployer.address,
      log: true,
      skipIfAlreadyDeployed: false
  });

  log('New Bridge deployed. Don\'t forget to actually call the upgrade function on the proxy after checking that everything is fine');
};

fn.tags = ['Core', 'RadarBridge'];
fn.dependencies = ['Config'];
fn.skip = async (hre) => {
  // Skip this on non-core deployments
  const config = await loadConfig(hre);
  return config.DEPLOYMENT_TYPE != "UPGRADE_BRIDGE"
};

export default fn;
