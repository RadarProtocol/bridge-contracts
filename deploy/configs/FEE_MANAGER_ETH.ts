import { ethers, utils } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { DeploymentConfig, saveConfig } from './../utils/config';

// General Configuration
const ENABLED = false; // If this config is enabled or not
const isDevDeploy = false; // Should always be false, only true when deploying to hardhat forks
const NETWORK = 1;// Network ID of deployment
const DEPLOYMENT_TYPE = "FEE_MANAGER"; // Deployment type: CORE, TOKEN, TOKEN_MIGRATION, FEE_MANAGER

// CORE
const BridgeChainID = ""; // The chain's id (ex: ETH)
const deployFeeManager = false; // Deploy a fee manager or not, must also complete CORE & FEE_MANAGER if true

// TOKEN & TOKEN_MIGRATOR
const TokenName = ""; // Token Name
const TokenSymbol = ""; // Token Symbol
const TokenDecimals = 18; // Token Decimals (always 18)
const TokenHasMigration = false; // If token needs migration, also complete TOKEN_MIGRATOR if true

// TOKEN_MIGRATOR
const OldTokenForMigration = ""; // The old token for the migration

// TOKEN_MIGRATOR & TOKEN & FEE_MANAGER
const NetworkProxyBridgeAddress = "0xA735c1Ab7B20F71CB16E09014c88C51d0086732A"; // Address of Bridge (Proxy)

// CORE & FEE_MANAGER (CORE only if deployFeeManager is true)
const feeManagerContract = "FeeManagerV1"; // Version of fee manager (ex: FeeManagerV1)
const percentageFee = 10000; // Initial percentage fee (scaled) (ex: 10000 = 1% in FeeManagerV1)
const initialMaxTokens = {
    "tokens": ['0xf9fbe825bfb2bf3e387af0dc18cac8d87f29dea8'],
    "maxFees": [ethers.utils.parseEther('50')]
}; // Should have a `tokens` and `maxFees` keys with arrays

const configuration: DeploymentConfig = {
    ENABLED,
    NETWORK,
    DEPLOYMENT_TYPE,
    BridgeChainID,
    deployFeeManager,
    TokenDecimals,
    TokenHasMigration,
    TokenName,
    TokenSymbol,
    OldTokenForMigration,
    NetworkProxyBridgeAddress,
    feeManagerContract,
    percentageFee,
    initialMaxTokens
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