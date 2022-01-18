import { constants, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

export async function saveConfig(hre: HardhatRuntimeEnvironment, data: DeploymentConfig) {
  await hre.deployments.save('Config', {
    abi: [],
    address: constants.AddressZero,
    linkedData: data,
  });
}

export async function loadConfig(hre: HardhatRuntimeEnvironment) {
  const deployment = await hre.deployments.get('Config');
  return deployment.linkedData as DeploymentConfig;
}

export async function hasConfig(hre: HardhatRuntimeEnvironment): Promise<boolean> {
  return !!(await hre.deployments.getOrNull('Config'));
}

export interface DeploymentConfig {
  ENABLED: boolean,
  DEPLOYMENT_TYPE: string,
  NETWORK: Number,
  BridgeChainID: string,
  TokenName: string,
  TokenSymbol: string,
  TokenDecimals: Number,
  NetworkProxyBridgeAddress: string,
  TokenHasMigration: boolean,
  OldTokenForMigration: string,
  deployFeeManager: boolean,
  feeManagerContract: string,
  percentageFee: Number,
  initialMaxTokens: { tokens: Array<string>, maxFees: Array<ethers.BigNumberish> }
}

const fn: DeployFunction = async () => {
  // Nothing to do here.
};

fn.tags = ['Config'];

export default fn;
