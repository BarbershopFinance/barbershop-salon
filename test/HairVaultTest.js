const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('HairVault', function (...args) {
  let dev;
  let deployer;
  let fee;

  beforeEach(async () => {
    ({ deployer, dev, fee } = await ethers.getNamedSigners());

    const HairToken = await ethers.getContractFactory('HairToken');
    this.hairToken = await HairToken.deploy();

    const Barber = await ethers.getContractFactory('Barber');

    this.barber = await Barber.deploy(this.hairToken.address, dev.address, fee.address, 1000, 100);

    const HairVaultContract = await ethers.getContractFactory('HairVault');

    this.hairVault = await HairVaultContract.deploy(this.hairToken.address, this.barber.address, deployer.address, fee.address);
  });

  it('The contract deploys correctly and starts at 0', async () => {
    expect(await this.hairVault.available()).to.equal(0);
    expect(await this.hairVault.balanceOf()).to.equal(0);
  });
});
