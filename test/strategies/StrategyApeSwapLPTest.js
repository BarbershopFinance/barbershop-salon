const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Vault Strategies: StrategyApeSwapLP', async function (...args) {
  let deployer;

  beforeEach(async () => {
    ({ deployer } = await ethers.getNamedSigners());

    const MockTokenFactory = await ethers.getContractFactory('MockERC20', deployer);

    this.lp1 = await MockTokenFactory.deploy('LPToken', 'LP1', 10000000000);
    this.lp2 = await MockTokenFactory.deploy('LPToken', 'LP2', 10000000000);

    const Strategy = await ethers.getContractFactory('StrategyApeSwapLP');
    this.strategy = await Strategy.connect(deployer).deploy(
      this.lp1.address,
      0,
      this.lp2.address,
      this.lp2.address,
      this.lp2.address,
      this.lp2.address,
      this.lp2.address,
      this.lp2.address,
      [
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
      ],
      [
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
      ],
      [
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
        '0x6cf8654e85ab489ca7e70189046d507eba233613',
      ],
    );

    await this.strategy.deployed();
  });

  it('The contract deploys correctly and starts at 0 balance', async () => {
    expect(await this.strategy.balanceOf()).to.equal(0);
  });

  it('The contract deploys correctly and starts at 0 balanceOfPool', async () => {
    expect(await this.strategy.balanceOfPool()).to.equal(0);
  });

  it('The contract deploys correctly and starts at 0 balanceOfWant', async () => {
    expect(await this.strategy.balanceOfWant()).to.equal(0);
  });
});
