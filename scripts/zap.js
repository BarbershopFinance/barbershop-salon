// Set up an ethers contract, representing our deployed Barber instance
const { addressBook } = require('blockchain-addressbook');
const { ethers } = require('hardhat');
const { sushiConfig } = require('../config/vaults/sushi/sushiConfig');

const { zapNativeToToken } = require('../test/utils/testHelpers');

const sushiRouterAddress = sushiConfig().router;

async function main () {
  const [deployer] = await ethers.getSigners();
  console.log('deployer: ', deployer.address);

  const vault = await ethers.getContractAt('VaultBarber', '0x8b94F8881B665D0b1776aA33401cF77ac42b44EB');

  const want = await vault.want();

  const unirouter = await ethers.getContractAt('IUniswapRouterETH', sushiRouterAddress);

  const zapRes = await zapNativeToToken({
    amount: ethers.utils.parseEther('0.4'),
    want,
    nativeTokenAddr: addressBook.polygon.tokens.WNATIVE.address,
    unirouter,
    recipient: deployer.address,
  });

  console.log('result: ', zapRes);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
