import { ethers } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { loadConfig } from '../utils/config';

const fn: DeployFunction = async function (hre) {

    const {
        deployments: { deploy, get, log },
        ethers: { getSigners },
    } = hre;

  const deployer = (await getSigners())[0];
  const config = await loadConfig(hre);
  
  const newToken = await get('BridgedToken');

  // Deploy
  await deploy("BridgedTokenMigrator", {
      from: deployer.address,
      args: [
          config.OldTokenForMigration,
          newToken.address
      ],
      log: true,
      skipIfAlreadyDeployed: false
  });

  // Pass Migration Authority
  const BridgedToken = await hre.ethers.getContractFactory("BridgedToken");
  const BridgedTokenContract = new ethers.Contract(
      newToken.address,
      BridgedToken.interface,
      deployer
  );
  const BridgedTokenMigrator = await get('BridgedTokenMigrator');
  const receipt1 = await BridgedTokenContract.passMigratorAuthority(BridgedTokenMigrator.address);
  await receipt1.wait();
  log("Passed migration authority to Migrator Contract.");


  // Accept Migration Authority
  const BridgedTokenMigratorFactory = await hre.ethers.getContractFactory("BridgedTokenMigrator");
  const BridgedTokenMigratorContract = new ethers.Contract(
      BridgedTokenMigrator.address,
      BridgedTokenMigratorFactory.interface,
      deployer
  );
  const receipt2 = await BridgedTokenMigratorContract.acceptMigratorAuthority();
  await receipt2.wait();
  log("Accepted Migration Authority");
};

fn.tags = ['Extra', 'BridgedTokenMigrator'];
fn.dependencies = ['Config', 'BridgedToken'];
fn.skip = async (hre) => {
  // Skip this on non-token deployments or non-migratable tokens
  const config = await loadConfig(hre);
  return config.DEPLOYMENT_TYPE != "TOKEN_MIGRATION" || !config.TokenHasMigration
};

export default fn;
