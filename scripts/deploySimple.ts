import * as hardhat from 'hardhat';
import { predictAddresses } from '../utils/predictAddresses';

const simpleConstructorArguments = [
  'Test',
  'Te',
  10_000
];

async function main() {
  
  const [deployer] = await hardhat.ethers.getSigners();
  const predictedAddresses = await predictAddresses({ creator: deployer.address }); 

  const SimpleContract = await hardhat.ethers.getContractFactory('Simple');

  let sc;
  try {
    sc = await SimpleContract.deploy(...simpleConstructorArguments);
    await sc.deployed()
  } catch (e) {
    console.log('Error deploying', e);
  }

  return sc;
}

main()
  .then((resp) => {
    console.log('done', resp.address)

    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });