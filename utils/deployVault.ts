import { Address } from "hardhat-deploy/dist/types";
import { predictAddresses } from '../utils/predictAddresses';
import { ethers } from 'hardhat';
import { verifyContract } from "./verifyContract";

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
  const [deployer] = await ethers.getSigners();
  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    config.name,
    config.symbol,
    config.delay,
  ];
  // const Vault = await ethers.getContractFactory(config.contractName);
  // const vault = await Vault.deploy(...vaultConstructorArguments);

  // console.log(`Deploying vault @${predictedAddresses.vault}...`);
 
  // await vault.deployed();

  const strategyConstructorArguments = [
    config.strategy.want,
    config.strategy.poolId,
    config.strategy.chef,
    // predictedAddresses.vault,
    '0xc8cd881865d14f439c5105713d0fd5d1892b9f7f',
    config.strategy.router,
    config.strategy.keeper,
    config.strategy.strategist,
    config.strategy.beefyFeeRecipient,
    config.strategy.outputToNativeRoute,
    config.strategy.outputToLp0Route,
    config.strategy.outputToLp1Route,
  ];
  // const Strategy = await ethers.getContractFactory(config.strategy.contractName);
  // const strategy = await Strategy.deploy(...strategyConstructorArguments);

  // console.log(`Deploying strategy @${predictedAddresses.strategy}...`);

  // await strategy.deployed();

  const verifyContractsPromises: Promise<any>[] = [];
  if (shouldVerifyOnEtherscan) {
    // skip await as this is a long running operation, and you can do other stuff to prepare vault while this finishes
    verifyContractsPromises.push(
      // verifyContract('0xc8cd881865d14f439c5105713d0fd5d1892b9f7f', vaultConstructorArguments),
      verifyContract('0xb53443fbb513d7444452d2d4db8c6b27081e62e5', strategyConstructorArguments)
    );

    await Promise.all(verifyContractsPromises);
  }

  console.log('done');
  // return { vault, strategy };
};

export default deployVault;
