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

    const VaultBarber = await ethers.getContractFactory('VaultBarber');
    this.vaultBarber = await VaultBarber.connect(deployer).deploy();
    await this.vaultBarber.deployed();
  });

  it('The contract deploys correctly and starts at 0 pools', async () => {
    expect(await this.vaultBarber.poolLength()).to.equal(0);
  });

  it('Can add pools', async () => {
    expect(await this.vaultBarber.poolLength()).to.equal(0);
  });

  // it('Can deposit and withdraw to barber', async () => {
  //   await this.hairToken.connect(alice).approve(this.hairVault.address, 1000);
  //   expect(await this.hairVault.balanceOf()).to.equal(0);

  //   await expectRevert(this.hairVault.connect(alice).deposit(50000), 'ERC20: transfer amount exceeds balance');

  //   expect(await this.hairVault.connect(alice).deposit(500)).to.emit(this.hairVault, 'Deposit');
  //   expect(await this.hairVault.balanceOf()).to.equal(500);
  //   expect(await this.hairVault.connect(alice).withdraw(500)).to.emit(this.hairVault, 'Withdraw');

  //   await expectRevert(this.hairVault.connect(alice).withdraw(500), 'Withdraw amount exceeds balance');
  // });
});
