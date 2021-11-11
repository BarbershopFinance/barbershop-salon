import { Address } from "hardhat-deploy/dist/types";
import { predictAddresses } from '../utils/predictAddresses';
import { ethers } from 'hardhat';

export interface VaultConfig {
  contractName: string
  signer: { address: string }
  name: string
  symbol: string
  delay: number

  strategy: StrategyConfig
}

export interface StrategyConfig {
  contractName: string
  want: Address
  poolId: number
  chef: Address
  router: Address

  keeper: Address
  strategist: Address
  beefyFeeRecipient: Address

  outputToNativeRoute: Address[]
  outputToLp0Route: Address[]
  outputToLp1Route: Address[]
}

const deployVault = async (config: VaultConfig) => {
  const predictedAddresses = await predictAddresses({ creator: config.signer.address });

  console.log(`Deploying vault @${predictedAddresses.vault}...`);
  const Vault = await ethers.getContractFactory(config.contractName);
  const vault = await Vault.deploy(
    predictedAddresses.strategy,
    config.name,
    config.symbol,
    config.delay,
  );
 
  await vault.deployed();

  console.log(`Deploying strategy @${predictedAddresses.vault}...`);
  const Strategy = await ethers.getContractFactory(config.strategy.contractName);
  const strategy = await Strategy.deploy(
    config.strategy.want,
    config.strategy.poolId,
    config.strategy.chef,
    vault.address,
    config.strategy.router,
    config.strategy.keeper,
    config.strategy.strategist,
    config.strategy.beefyFeeRecipient,
    config.strategy.outputToNativeRoute,
    config.strategy.outputToLp0Route,
    config.strategy.outputToLp1Route,
  );

  await strategy.deployed();

  console.log({ vault, strategy });

  return { vault, strategy };
};

export default deployVault;
