import { Contract } from '@ethersproject/contracts';
import { Address } from "hardhat-deploy/dist/types";
import { ethers } from 'hardhat';
import { predictAddresses } from '../predictAddresses';

const shouldVerifyOnEtherscan = true;

export interface VaultConfig {
  contractName: string
  name: string
  symbol: string
  delay: number

  strategy: StrategyConfig
}

export interface StrategyConfig {
  contractName: string
  want: Address
  chef: Address
  router: Address

  keeper: Address
  strategist: Address
  barbershopFeeRecipient: Address

  outputToNativeRoute: Address[]
  outputToLp0Route: Address[]
  outputToLp1Route: Address[]
}

const deployVault = async (config: VaultConfig): Promise<{ vault: Contract, strategy: Contract }> => {
  const [deployer] = await ethers.getSigners();
  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    config.name,
    config.symbol,
    config.delay,
  ];
  const Vault = await ethers.getContractFactory(config.contractName);

  let vault;
  try {
    console.log(`Deploying vault @${predictedAddresses.vault}...`);
    vault = await Vault.deploy(...vaultConstructorArguments);
    console.log('waiting ...');
    await vault.deployed();
    console.log('Vault deployed! done.');
  } catch (e) {
    console.log('Error deploying', e);
  }

  // @dev: comment out the arguments you don't need in constructor (ie. quick doesn't need )
  const strategyConstructorArguments = [
    predictedAddresses.vault,
    config.strategy.want,
    config.strategy.chef,
    config.strategy.router,
    config.strategy.keeper,
    config.strategy.strategist,
    config.strategy.barbershopFeeRecipient,
    config.strategy.outputToNativeRoute,
    config.strategy.outputToLp0Route,
    config.strategy.outputToLp1Route,
  ].filter(item => item);
  const Strategy = await ethers.getContractFactory(config.strategy.contractName);
  const strategy = await Strategy.deploy(...strategyConstructorArguments);

  console.log(`Deploying strategy @${predictedAddresses.strategy}...`);

  await strategy.deployed();

  console.log('done');
  return { vault, strategy };
};

export default deployVault;
