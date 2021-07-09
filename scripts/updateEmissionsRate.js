// Set up an ethers contract, representing our deployed Barber instance
const { ethers } = require('hardhat');

async function main () {
  const [deployer] = await ethers.getSigners();
  console.log('deployer: ', deployer);

  // We get the contract to deploy
  const Barber = await ethers.getContractFactory('Barber');
  const barber = await Barber.attach(process.env.BARBER_ADDRESS);

  const value = await barber.updateEmissionRate(2);

  console.log('value: ', value);

  const result = await value.wait();
  console.log('result: ', result);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
