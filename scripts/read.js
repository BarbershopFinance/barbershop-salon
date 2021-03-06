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

  const vault = await ethers.getContractAt('VaultBarber', '0x7b38E07A5Ab75Be69878f825de336b4EFa07A426');

  const value = await vault.strategy();

  console.log('value: ', value);

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
