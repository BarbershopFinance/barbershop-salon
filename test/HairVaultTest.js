const { ethers } = require('hardhat');
const { expect } = require('chai');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

describe('HairVault', async function (...args) {
  let dev;
  let deployer;
  let fee;
  let alice;

  beforeEach(async () => {
    ({ deployer, dev, fee, alice } = await ethers.getNamedSigners());

    const HairToken = await ethers.getContractFactory('HairToken');
    this.hairToken = await HairToken.connect(deployer).deploy();

    const Barber = await ethers.getContractFactory('Barber');
    this.barber = await Barber.connect(deployer).deploy(this.hairToken.address, dev.address, fee.address, 1000, 100);
    await this.barber.deployed();

    await this.hairToken.connect(deployer).mint(alice.address, 5000);

    await this.hairToken.connect(deployer).transferOwnership(this.barber.address);

    // add the hair pool
    await this.barber.add(1000, this.hairToken.address, 0, true);

    const HairVaultContract = await ethers.getContractFactory('HairVault');
    this.hairVault = await HairVaultContract.deploy(this.hairToken.address, this.barber.address, deployer.address, fee.address);
  });

  it('The contract deploys correctly and starts at 0', async () => {
    expect(await this.hairVault.available()).to.equal(0);
    expect(await this.hairVault.balanceOf()).to.equal(0);
  });

  it('Can deposit and withdraw to barber', async () => {
    await this.hairToken.connect(alice).approve(this.hairVault.address, 1000);
    expect(await this.hairVault.balanceOf()).to.equal(0);

    await expectRevert(this.hairVault.connect(alice).deposit(50000), 'ERC20: transfer amount exceeds balance');

    expect(await this.hairVault.connect(alice).deposit(500)).to.emit(this.hairVault, 'Deposit');
    expect(await this.hairVault.balanceOf()).to.equal(500);
    expect(await this.hairVault.connect(alice).withdraw(500)).to.emit(this.hairVault, 'Withdraw');

    await expectRevert(this.hairVault.connect(alice).withdraw(500), 'Withdraw amount exceeds balance');
  });
});
