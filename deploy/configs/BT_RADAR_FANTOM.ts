import { utils } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { DeploymentConfig, saveConfig } from '../utils/config';

const isDevDeploy = false;
const ENABLED = false;

const DEPLOYMENT_TYPE = "TOKEN";
const NETWORK = 250;
const BridgeChainID = "";
const TokenName = "Radar";
const TokenSymbol = "RADAR";
const TokenDecimals = 18;
const NetworkProxyBridgeAddress = "0x595762ed748884fb4578A3E45A95fA2471F04aE4";
const TokenHasMigration = false;
const OldTokenForMigration = "";

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