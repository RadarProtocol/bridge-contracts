import { DeployFunction } from 'hardhat-deploy/types';

import { loadConfig } from '../utils/config';

const fn: DeployFunction = async function (hre) {

    const {
        deployments: { deploy, get, log },
        ethers: { getSigners },
    } = hre;

  const deployer = (await getSigners())[0];
  const config = await loadConfig(hre);
  
  await deploy('BridgedToken', {
      from: deployer.address,
      args: [
          config.TokenName,
          config.TokenSymbol,
          config.TokenDecimals,
          config.NetworkProxyBridgeAddress,
          config.TokenHasMigration
      ],
      log: true,
      skipIfAlreadyDeployed: true
  });

  log("TOKEN DEPLOYED! DON'T FORGET TO ADD TO MAIN BRIDGE ON ALL NETWORKS!");
};

fn.tags = ['Extra', 'BridgedToken'];
fn.dependencies = ['Config'];
fn.skip = async (hre) => {
  // Skip this on non-token deployments
  const config = await loadConfig(hre);
  return config.DEPLOYMENT_TYPE != "TOKEN" && config.DEPLOYMENT_TYPE != "TOKEN_MIGRATION"
};

export default fn;
