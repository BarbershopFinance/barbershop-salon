const { ethers } = require('hardhat');
// const { BN } = require('@openzeppelin/test-helpers');
const { BigNumber: BN } = require('@ethersproject/bignumber');
const { LedgerSigner } = require('@ethersproject/hardware-wallets');

const TOKENS_PER_BLOCK = 1;
const INITIAL_TOKENS_TO_MINT = 15000;
const BLOCKS_PER_HOUR = (60 * 60 / 2); // Matic blocks are ~ 2 seconds
const BLOCKS_PER_DAY = 24 * BLOCKS_PER_HOUR;
// bod: change after testing
// const TIMELOCK_DELAY_SECS = (60 * 60 * 24); // 1 day
const TIMELOCK_DELAY_SECS = (30); // 30 sec

async function logEvents (tx) {
  const receipt = await tx.wait();
  const events = await receipt.events;

  console.log(`=== Transaction ${tx.hash} successful ===`);
  console.log('Events logged: ', events.map(ev => ev.event));
}

async function main () {
  const signers = await ethers.getSigners();
  signers.map(s => console.log(s.address + '\n'));
  console.log('===============');

  const { deployer, dev, fee } = await ethers.getNamedSigners();
  console.log('deployer dev fee', deployer, dev, fee);
  console.log('deployer.address', deployer.address);
  console.log('dev.address', dev.address);
  console.log('fee.address', fee.address);

  // return;
  // const network = 'https://polygon-mainnet.infura.io/v3/df0d3df3665c451dbb751a091d4619da';

  // const provider = new ethers.providers.JsonRpcProvider(network);

  // .InfuraProvider(
  //   'https://polygon-mainnet', // or 'ropsten', 'rinkeby', 'kovan', 'goerli'
  //   process.env.INFURA_KEY,
  // );

  // network, {
  //   etherscan: '',
  //   infura: process.env.INFURA_PROJECT_ID,
  // });
  // console.log('provider_____', provider);
  // const deployer = new LedgerSigner(provider);

  console.log('deployer_____', deployer);
  console.log('===============');
  /**
   * Deploy Hair Token
   */
  const HairToken = await ethers.getContractFactory('HairToken');
  let hairToken;
  try {
    hairToken = await HairToken.connect(deployer).deploy();
  } catch (e) {
    console.log('**e**', e);
  }

  console.log('token', hairToken);

  console.log('=== Hair token stats: ===');
  console.log('Decimals: ', await hairToken.decimals());
  console.log('Token name: ', await hairToken.name());
  console.log('Total Supply at start: ', await (await hairToken.totalSupply()).toString());
  console.log('Deployer Supply at start: ', await (await hairToken.balanceOf(deployer.address)).toString());
  console.log('Dev Supply at start: ', await (await hairToken.balanceOf(dev.address)).toString());
  console.log('Fee Supply at start: ', await (await hairToken.balanceOf(fee.address)).toString());
  console.log('\n...\n');

  /**
   * Mint initial liquidity
   */
  const amountToMint = BN.from(INITIAL_TOKENS_TO_MINT).mul(BN.from(String(10 ** 18)));
  console.log('Minting: ', amountToMint.toString());

  await hairToken.connect(deployer).mint(deployer.address, amountToMint);
  console.log('\n...\n');
  console.log('Total Supply: ', await (await hairToken.totalSupply()).toString());
  console.log('Deployer Supply: ', await (await hairToken.balanceOf(deployer.address)).toString());
  console.log('\n...\n');

  /**
   * Deploy Barber
   */
  const BarberContract = await ethers.getContractFactory('MasterChef');
  const barber = await BarberContract.connect(deployer).deploy(
    hairToken.address,
    dev.address,
    fee.address,
    BN.from(TOKENS_PER_BLOCK).mul(BN.from(String(10 ** 18))),
    0,
  );

  // console.log('AllPools array starts empty: ', await barber.poolExistence);
  console.log('=== Transferring ownership ===');
  console.log('before hairToken owner: ', await hairToken.owner());

  /**
   * Transfer ownership
   */
  const transferOwnershipTx = await hairToken.connect(deployer).transferOwnership(barber.address);
  logEvents(transferOwnershipTx);

  console.log('after hairToken owner: ', await hairToken.owner());

  /**
   * Deploy Timelock
   */
  const TimelockContract = await ethers.getContractFactory('Timelock');
  const timelock = await TimelockContract.connect(deployer).deploy(deployer.address, TIMELOCK_DELAY_SECS);

  console.log('\n...\n');
  console.log('=== Deployed contracts ===');
  console.table({
    HairToken: hairToken.address,
    Barber: barber.address,
    Timelock: timelock.address,
  });

  console.log('All successful!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
