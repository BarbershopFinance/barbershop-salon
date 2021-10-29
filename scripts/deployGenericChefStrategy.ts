import hardhat, { ethers, web3 } from 'hardhat';
import { addressBook } from 'blockchain-addressbook';
import { predictAddresses } from '../utils/predictAddresses';
import { setCorrectCallFee } from '../utils/setCorrectCallFee';
import { setPendingRewardsFunctionName } from '../utils/setPendingRewardsFunctionName';
import { verifyContract } from '../utils/verifyContract';

const {
  WMATIC: { address: WMATIC },
  BANANA: { address: BANANA },
} = addressBook.polygon.tokens;
const { apeswap } = addressBook.polygon.platforms;

const myAddress = '0x749Ed2e4A52B44eE6d7c111f47Ef3e4a8bafe4f5';

const shouldVerifyOnEtherscan = false;

const vaultParams = {
  follicleName: 'Follicle ApeSwap BANANA-MATIC',
  follicleSymbol: 'follicleApeSwapBANANA-MATIC',
  delay: 0,
  // delay: 21600,
};

const strategyParams = {
  want: web3.utils.toChecksumAddress('0x034293F21F1cCE5908BC605CE5850dF2b1059aC0'), // banana-matic ApePair
  poolId: 0, // banana-matic
  chef: apeswap.minichef, // MiniApeV2
  unirouter: apeswap.router, // ApeRouter
  strategist: myAddress,
  keeper: myAddress,
  beefyFeeRecipient: myAddress,
  outputToNativeRoute: [BANANA, WMATIC],
  outputToLp0Route: [BANANA, WMATIC],
  outputToLp1Route: [BANANA],
  pendingRewardsFunctionName: 'pendingBanana', // used for rewardsAvailable(), use correct function name from masterchef
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

  console.log('Deploying:', vaultParams.follicleName);

  const predictedAddresses = await predictAddresses({ creator: deployer.address });

  console.log('predictedAddresses', predictedAddresses);

  const vaultConstructorArguments = [
    predictedAddresses.strategy,
    vaultParams.follicleName,
    vaultParams.follicleSymbol,
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
    strategyParams.outputToLp1Route,
  ];
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
  }
  // await setPendingRewardsFunctionName(strategy, strategyParams.pendingRewardsFunctionName);
  // await setCorrectCallFee(strategy, hardhat.network.name);
  console.log();

  await Promise.all(verifyContractsPromises);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });