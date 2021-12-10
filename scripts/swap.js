// Set up an ethers contract, representing our deployed Barber instance
const { addressBook } = require('blockchain-addressbook');
const { ethers } = require('hardhat');

const { zapNativeToToken } = require('../test/utils/testHelpers');

async function main () {
  const [deployer, b, c, d, e, f, g] = await ethers.getSigners();
  console.log('deployer: ', deployer.address);
  console.log('b: ', b.address);
  console.log('c: ', c.address);
  console.log('d: ', d.address);
  console.log('e: ', e.address);
  console.log('f: ', f.address);
  console.log('g: ', g.address);

  const { timestamp } = await ethers.provider.getBlock();

  const apeRouterAddress = '0xc0788a3ad43d79aa53b09c2eacc313a787d1d607';
  // const vault = await ethers.getContractAt('VaultBarber', '0x7b38E07A5Ab75Be69878f825de336b4EFa07A426');

  // const value = await vault.strategy();

  // console.log('value: ', value);

  const unirouter = await ethers.getContractAt('IUniswapRouterETH', apeRouterAddress);

  const tokenIn = addressBook.polygon.tokens.WBTC.address;
  const tokenOut = addressBook.polygon.tokens.WMATIC.address;

  console.log(tokenIn, tokenOut);
  // return;
  const resp = await unirouter.swapExactETHForTokens(
    0,
    [tokenIn, tokenOut],
    deployer.address,
    timestamp + 60,
    {
      value: 4206942069,
    },
  );

  // const result = await value.wait();
  console.log('result: ', resp);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
