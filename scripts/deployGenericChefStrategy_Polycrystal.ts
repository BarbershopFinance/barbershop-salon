import hardhat, { ethers, web3 } from 'hardhat';
import { addressBook } from 'blockchain-addressbook';
import { predictAddresses } from '../utils/predictAddresses';
import { setCorrectCallFee } from '../utils/setCorrectCallFee';
import { setPendingRewardsFunctionName } from '../utils/setPendingRewardsFunctionName';
import { verifyContract } from '../utils/verifyContract';

const {
  WMATIC: { address: WMATIC },
  BANANA: { address: BANANA },
  // WETH: { address: WETH }
} = addressBook.polygon.tokens;
const { apeswap } = addressBook.polygon.platforms;

const myAddress = '0x749Ed2e4A52B44eE6d7c111f47Ef3e4a8bafe4f5';
const HAIR = '0x100a947f51fa3f1dcdf97f3ae507a72603cae63c';
const CRYSTAL = '0x76bF0C28e604CC3fE9967c83b3C3F31c213cfE64';
const PDOGE = '0x8a953cfe442c5e8855cc6c61b1293fa648bae472';

const shouldVerifyOnEtherscan = false;

const vaultParams = {
  name: 'CMax',
  symbol: 'CMX',
  delay: 0,
  // delay: 21600,
};

const strategyParams = {
  want: web3.utils.toChecksumAddress('0x5d9d66ac0db91ec463fb3e9e5b1513dbff02fd0f'), // pdoge-matic
  poolId: 8, // banana-matic
  // chef: apeswap.minichef, // MiniApeV2
  chef: web3.utils.toChecksumAddress('0xebcc84d2a73f0c9e23066089c6c24f4629ef1e6d'), // pdoge-matic
  unirouter: apeswap.router, // ApeRouter
  strategist: myAddress,
  keeper: myAddress,
  beefyFeeRecipient: myAddress,
  outputToNativeRoute: [CRYSTAL, WMATIC],
  outputToLp0Route: [CRYSTAL, PDOGE, WMATIC],
  outputToLp1Route: [CRYSTAL, PDOGE],
  pendingRewardsFunctionName: 'pendingCrystal', // used for rewardsAvailable(), use correct function name from masterchef
};

const contractNames = {
  vault: 'VB',
  strategy: 'StrategyApeSwapLP',
};

async function main() {
  if (
    Object.values(vaultParams).some(v => v === undefined) ||
    Object.values(strategyParams).some(v => v === undefined) ||
    Object.values(contractNames).some(v => v === undefined)
  ) {
    console.error('one of config values undefined');
    return;
  }

  await hardhat.run('compile');

  const Vault = await ethers.getContractFactory(contractNames.vault);
  const Strategy = await ethers.getContractFactory(contractNames.strategy);

  const [deployer] = await ethers.getSigners();

  console.log('Deploying:', vaultParams.name);

  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  console.log('predictedAddresses', predictedAddresses);

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    vaultParams.name,
    vaultParams.symbol,
    vaultParams.delay,
  ];
  const vault = await Vault.deploy(...vaultConstructorArguments);
  await vault.deployed();

  const strategyConstructorArguments = [
    strategyParams.want,
    strategyParams.poolId,
    strategyParams.chef,
    vault.address,
    strategyParams.unirouter,
    strategyParams.keeper,
    strategyParams.strategist,
    strategyParams.beefyFeeRecipient,
    strategyParams.outputToNativeRoute,
    strategyParams.outputToLp0Route,
    strategyParams.outputToLp1Route
  ];

  console.log('deploying strategy...');
  const strategy = await Strategy.deploy(...strategyConstructorArguments);
  await strategy.deployed();

  // add this info to PR
  console.log();
  console.log('Vault:', vault.address);
  console.log('Strategy:', strategy.address);
  console.log('Want:', strategyParams.want);
  console.log('PoolId:', strategyParams.poolId);

  console.log();
  console.log('Running post deployment');

  const verifyContractsPromises: Promise<any>[] = [];
  if (shouldVerifyOnEtherscan) {
    // skip await as this is a long running operation, and you can do other stuff to prepare vault while this finishes
    verifyContractsPromises.push(
      verifyContract(vault, vaultConstructorArguments),
      verifyContract(strategy, strategyConstructorArguments)
    );

    await Promise.all(verifyContractsPromises);
  }
  // await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  // await setCorrectCallFee(strategy, hardhat.network.name);
  console.log('done');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });