
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more


require('dotenv').config();
require('hardhat-abi-exporter');

// require('@nomiclabs/hardhat-ganache');
// require('@nomiclabs/hardhat-truffle5');
// require('@nomiclabs/hardhat-waffle');
// require('@nomiclabs/hardhat-solhint');
// require('@nomiclabs/hardhat-ethers');
// require('@nomiclabs/hardhat-etherscan');
// require('hardhat-deploy-ethers');
require('hardhat-deploy');

// require('hardhat-gas-reporter');

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter"
// import "./tasks";

// const { mnemonic } = require('./secrets.json');

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    compilers: [
      { version: '0.8.6' },
    ],
  },
  defaultNetwork: 'hardhat',
  gasReporter: {
    enabled: true, // (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      gasPrice: 20000000000,
      // accounts: { mnemonic: mnemonic },
    },
    development: {
      url: 'http://127.0.0.1:7545',
      port: 7545,
      network_id: '101',
    },
    testing: {
      url: 'http://127.0.0.1:7545',
      port: 7545,
      network_id: '*',
      gasPrice: 8000000000,
      gas: 2100000,
    },
    maticMainnet: {
      url: 'https://polygon-rpc.com',
      chainId: 137,
      networkId: 137,
      gas: 2100000,
      gasPrice: 32e9,
      accounts: {
        initialIndex: 1,
        mnemonic: `${process.env.MNEMONIC}`,
      },
    },
    maticTestnet: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: {
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 80001,
      gasPrice: 8000000000,
      gas: 2100000,
    },
    infura: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: {
        // eslint-disable-next-line quotes
        // path: "m/44'/60'/0'/0", // ledger wallet
        // eslint-disable-next-line quotes
        // path: "m/44'/60'/0'/0/0",
        // initialIndex: 0,
        // count: 100,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 137,
      networkId: 137,
      gasPrice: 8000000000,
      gas: 2100000,
    },
  },
  namedAccounts: {
    deployer: 0,
    dev: 1,
    fee: 2,
    alice: 4,
    bob: 5,
    carol: 6,
    dan: 7,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './build',
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  abiExporter: {
    path: './abidata',
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  }
};
