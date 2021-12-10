import hardhat, { ethers } from 'hardhat';

// match these with the current strategy
const config = {
  want: 'FILL_ME_IN',
  output: 'FILL_ME_IN',
  targetRewardPool: 'FILL_ME_IN',
  vault: 'FILL_ME_IN',
  keeper: 'FILL_ME_IN',
  strategist: 'FILL_ME_IN',
};

async function main () {
  await hardhat.run('compile');

  // const [deployer] = await ethers.getSigners();

  const Strategy = await ethers.getContractFactory('FILL_ME_IN');
  const strategy = await Strategy.deploy(
    config.want,
    config.output,
    config.targetRewardPool,
    config.vault,
    config.keeper,
    config.strategist,
  );
  await strategy.deployed();

  console.log('Candidate deployed to:', strategy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
