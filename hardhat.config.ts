import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/types";
import 'hardhat-deploy';
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { utils } from 'ethers';

dotenv.config();

function node(networkName: string) {
  const fallback = 'http://localhost:8545';
  const uppercase = networkName.toUpperCase();
  const uri = process.env[`${uppercase}_NODE`] || process.env.ETHEREUM_NODE || fallback;
  return uri.replace('{{NETWORK}}', networkName);
}

function accounts(networkName: string) {
  const uppercase = networkName.toUpperCase();
  const accounts = process.env[`${uppercase}_ACCOUNTS`] || process.env.ETHEREUM_ACCOUNTS || '';
  return accounts
    .split(',')
    .map((account) => account.trim())
    .filter(Boolean);
}

const mnemonic = 'test test test test test test test test test test test junk';

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    settings: {
      optimizer: {
        details: {
          yul: false,
        },
        enabled: true,
        runs: 200,
      },
    },
    version: '0.8.0',
  },
  namedAccounts: {
    deployer: 0
  },
  networks: {
    hardhat: {
      hardfork: 'london',
      accounts: {
        accountsBalance: utils.parseUnits('1', 36).toString(),
        count: 5,
        mnemonic,
      },
      forking: {
        // blockNumber: 13430490,
        // blockNumber: 13603419,
        url: node('ethereum'), // Oct 16, 2021
      },
      gas: 9500000,
      gasMultiplier: 1.1,
      ...(process.env.COVERAGE && {
        allowUnlimitedContractSize: false,
      }),
    },
    ethereum: {
      hardfork: 'london',
      accounts: accounts('ethereum'),
      url: node('ethereum'),
      timeout: 259200000,
      gasPrice: 130000000000,
      gasMultiplier: 1.1
    }
  },
};

export default config;