// Set up an ethers contract, representing our deployed Barber instance
const { ethers } = require('hardhat');

async function main () {
  const [deployer] = await ethers.getSigners();
  console.log('deployer: ', deployer);

  const Barber = await ethers.getContractFactory('Barber');
  const barber = await Barber.attach(process.env.BARBER_ADDRESS);

  const value = await (await barber.hairPerBlock()).toString();

  console.log('value: ', value);
  console.log('value e18: ', value / 1e18);

  // const value2 = await barber.poolExistence();
  // console.log('value: ', value2);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
