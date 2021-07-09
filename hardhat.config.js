
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

require('dotenv').config();
require('@nomiclabs/hardhat-ganache');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-deploy-ethers');
require('hardhat-deploy');

require('hardhat-gas-reporter');

const { mnemonic } = require('./secrets.json');

const INFURA_PROJECT_ID = process.env.PRIVATE_KEY;

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
      accounts: { mnemonic: mnemonic },
    },
    development: {
      url: 'http://127.0.0.1:7545',
      port: 7545,
      network_id: '101',
      // gasPrice:   0x1,
      // gas:        0x1fffffffffffff
    },
    testing: {
      url: 'http://127.0.0.1:7545',
      port: 7545,
      network_id: '*',
      // gasPrice: 0,
      accounts: { mnemonic: mnemonic },
      gasPrice: 8000000000,
      gas: 2100000,
    },
    maticMainnet: {
      url: 'https://rpc-mainnet.maticvigil.com',
      chainId: 137,
      networkId: 137,
      gas: 5500000,
      accounts: {
        mnemonic: `${process.env.MNEMONIC}`,
      },
    },
    maticTestnet: {
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [
        '9bb987718a0382205c5af693b7ac72a00668b15da7fd6e5434e35d7f2ab1f6ec',
      ],
      chainId: 80001,
      gasPrice: 8000000000,
      gas: 2100000,
    },
    infura: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: {
        // eslint-disable-next-line quotes
        // path: "m/44'/60'/0'/0", // ledger wallet
        initialIndex: 0,
        // count: 100,
        mnemonic: `${process.env.MNEMONIC}`,
      },
      chainId: 137,
      // networkId: 137,
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
};
