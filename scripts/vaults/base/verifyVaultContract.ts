import { ethers } from 'hardhat';
import { Address } from "hardhat-deploy/dist/types";
import { predictAddresses } from '../utils/predictAddresses';
import { verifyContract } from "../../../utils/verifyVaultContract";

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
  barbershopFeeRecipient: Address

  outputToNativeRoute: Address[]
  outputToLp0Route: Address[]
  outputToLp1Route: Address[]
}

const verifyVaultContract = async (config: VaultConfig) => {
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
    config.strategy.barbershopFeeRecipient,
    config.strategy.outputToNativeRoute,
    config.strategy.outputToLp0Route,
    config.strategy.outputToLp1Route,
  ];

  const verifyContractsPromises: Promise<any>[] = [];
    // comment out the vault or strat if it has been verified already as similar to another contract
    verifyContractsPromises.push(
      verifyContract('FILL_ME_IN_WITH_VAULT', vaultConstructorArguments),
      verifyContract('FILL_ME_IN_WITH_STRAT', strategyConstructorArguments)
    );

    await Promise.all(verifyContractsPromises);
  }

  console.log('done');
};

export default verifyVaultContract;
