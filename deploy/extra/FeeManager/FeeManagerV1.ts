import { ethers } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/types';

import { loadConfig } from '../../utils/config';

const fn: DeployFunction = async function (hre) {

	const {
		deployments: { deploy, get, log },
		ethers: { getSigners },
	} = hre;

  const deployer = (await getSigners())[0];
  const config = await loadConfig(hre);

  if (config.feeManagerContract != "FeeManagerV1") {
	  return;
  }
  
  var bridgeAddress;
  if (config.DEPLOYMENT_TYPE == "FEE_MANAGER") {
	  bridgeAddress = config.NetworkProxyBridgeAddress;
	  if (bridgeAddress == ethers.constants.AddressZero) {
		  log("Config NetworkProxyBridgeAddress is 0x0. Cancel deployment...");
		  return;
	  }
  } else {
	  if (!config.deployFeeManager) {
		  return;
	  }
	  bridgeAddress = await get('RadarBridgeProxy');
	  bridgeAddress = bridgeAddress.address;
  }

  await deploy('FeeManagerV1', {
	  from: deployer.address,
	  args: [
		  config.percentageFee,
		  config.initialMaxTokens.tokens,
		  config.initialMaxTokens.maxFees
	  ],
	  log: true,
	  skipIfAlreadyDeployed: true
  });

  log('Registering Fee Manager on bridge (if I have permission)');

  const setFeeInterface = new ethers.utils.Interface(["function changeFeeManager(address _newFeeManager)"]);
  const bridgeContract = new ethers.Contract(
	  bridgeAddress,
	  setFeeInterface,
	  deployer
  );

  const newFeeManager = await get('FeeManagerV1');

  await bridgeContract.changeFeeManager(newFeeManager.address);

  log("Registered Fee Manager");
};

fn.tags = ['Extra', 'FeeManagerV1'];
fn.dependencies = ['Config'];
fn.skip = async (hre) => {
  const config = await loadConfig(hre);
  return config.DEPLOYMENT_TYPE != "FEE_MANAGER" && config.DEPLOYMENT_TYPE != "CORE"
};

export default fn;
