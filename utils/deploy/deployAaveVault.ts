import { Contract } from '@ethersproject/contracts';
import { Address } from "hardhat-deploy/dist/types";
import { ethers } from 'hardhat';
import { predictAddresses } from '../predictAddresses';

export interface AaveVaultConfig {
  contractName: string
  name: string
  symbol: string
  delay: number

  strategy: AaveStrategyConfig
}

export interface AaveStrategyConfig {
  contractName: string
  want: Address
  router: Address
  native: Address

  dataProvider: Address
  lendingPool: Address
  incentivesController: Address

  keeper: Address
  strategist: Address
  barbershopFeeRecipient: Address
}

// deploys a lend/borrow strategy
const deployAaveVault = async (config: AaveVaultConfig): Promise<{ vault: Contract, strategy: Contract }> => {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer: ', deployer.address);
  
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
    const res = await vault.deployed();
    console.log('Vault deployed! done.');
  } catch (e) {
    console.log('Error deploying', e);
  }

  const strategyConstructorArguments = [
    predictedAddresses.vault,
    config.strategy.want,
    config.strategy.native,
    config.strategy.dataProvider,
    config.strategy.lendingPool,
    config.strategy.incentivesController,
    config.strategy.router,
    config.strategy.keeper,
    config.strategy.strategist,
    config.strategy.barbershopFeeRecipient,
  ]

  console.log('config.strategy.contractName')
  const Strategy = await ethers.getContractFactory(config.strategy.contractName);
  console.log(`Deploying strategy @${predictedAddresses.strategy}...`);

  const strategy = await Strategy.deploy(...strategyConstructorArguments);
  console.log('waiting ...');

  await strategy.deployed();

  console.log('done');
  return { vault, strategy };
};

export default deployAaveVault;
