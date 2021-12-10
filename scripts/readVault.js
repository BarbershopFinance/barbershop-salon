// Set up an ethers contract, representing our deployed Barber instance
const { ethers } = require('hardhat');

async function main () {
  const [deployer, b, c, d, e, f, g] = await ethers.getSigners();
  console.log('deployer: ', deployer.address);
  console.log('b: ', b.address);
  console.log('c: ', c.address);
  console.log('d: ', d.address);
  console.log('e: ', e.address);
  console.log('f: ', f.address);
  console.log('g: ', g.address);
  const { alice } = await ethers.getNamedSigners();

  const vault = await ethers.getContractAt('VaultBarber', '0x39e596Dc819ad398512D5081F10811d44c3bd60F');

  const stratAddress = await vault.strategy();

  console.log('stratAddress: ', stratAddress);

  const strategy = await ethers.getContractAt('StrategySushiSwapLP', stratAddress);

  const callReward = await strategy.callReward();

  console.log('callReward: ', callReward);

  const rewardsAvailable = await strategy.rewardsAvailable();

  console.log('rewards avail: ', rewardsAvailable);

  const outputToNative = await strategy.outputToNative();

  console.log('outputToNative', outputToNative);

  // try {
  //   // await strategy.connect(alice).harvestWithCallFeeRecipient(alice.address);
  //   await strategy.connect(alice).harvest();
  // } catch (e) {
  //   console.log('e', e);
  // }

  return null;

  // const result = await value.wait();
  // console.log('result: ', result);

  // const barber = await Barber.attach(process.env.BARBER_ADDRESS);

  // const value = await (await barber.hairPerBlock()).toString();

  // console.log('value: ', value);
  // console.log('value e18: ', value / 1e18);

  // const value2 = await barber.poolExistence();
  // console.log('value: ', value2);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
