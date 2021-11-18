import { utils } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { DeploymentConfig, saveConfig } from '../utils/config';

const isDevDeploy = false;
const ENABLED = false;

const DEPLOYMENT_TYPE = "TOKEN_MIGRATION";
const NETWORK = 56;
const BridgeChainID = "";
const TokenName = "Radar";
const TokenSymbol = "RADAR";
const TokenDecimals = 18;
const NetworkProxyBridgeAddress = "0xBe0a25915acDD6eA0FE7F6EFC1C68a6a79fF9110";
const TokenHasMigration = true;
const OldTokenForMigration = "0xf9FBE825BFB2bF3E387af0Dc18caC8d87F29DEa8";

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