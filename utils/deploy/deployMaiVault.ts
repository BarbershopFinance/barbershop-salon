import { Contract } from '@ethersproject/contracts';
import { Address } from "hardhat-deploy/dist/types";
import { ethers } from 'hardhat';
import { predictAddresses } from '../predictAddresses';
import { VaultConfig } from './deploySushiVault';

// works with mai farm
const deployMaiVault = async (config: VaultConfig): Promise<{ vault: Contract, strategy: Contract }> => {
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
    config.strategy.poolId,
    config.strategy.chef,
    config.strategy.router,
    config.strategy.strategist,
    config.strategy.keeper,
    config.strategy.barbershopFeeRecipient,
    config.strategy.outputToNativeRoute,
    config.strategy.outputToLp0Route,
    config.strategy.outputToLp1Route,
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

export default deployMaiVault;
