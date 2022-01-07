import { utils } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { DeploymentConfig, saveConfig } from '../utils/config';

const isDevDeploy = false;
const ENABLED = false;

const DEPLOYMENT_TYPE = "CORE";
const NETWORK = 137;
const BridgeChainID = "POLYGON";
const TokenName = "";
const TokenSymbol = "";
const TokenDecimals = 0;
const TokenHasMigration = false;
const OldTokenForMigration = "";
const NetworkProxyBridgeAddress = "";

const configuration: DeploymentConfig = {
    ENABLED,
    DEPLOYMENT_TYPE,
    NETWORK,
    BridgeChainID,
    TokenName,
    TokenSymbol,
    TokenDecimals,
    TokenHasMigration,
    OldTokenForMigration,
    NetworkProxyBridgeAddress
}

const fn: DeployFunction = async (hre) => {
    await saveConfig(hre, configuration);
};
  
fn.tags = ['Config'];
fn.skip = async (hre) => {
    // Run this only for mainnet & mainnet forks.
    const chain = parseInt(await hre.getChainId());
    return (chain !== NETWORK && !isDevDeploy) || !ENABLED
};
  
export default fn;