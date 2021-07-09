const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Barber', function (...args) {
  let MockTokenFactory;
  let dev;
  let deployer;
  let fee;
  let alice;
  let bob;

  beforeEach(async () => {
    ({ deployer, dev, fee, alice, bob } = await ethers.getNamedSigners());

    const HairToken = await ethers.getContractFactory('HairToken');
    this.hairToken = await HairToken.deploy();

    MockTokenFactory = await ethers.getContractFactory('MockERC20', deployer);

    this.lp1 = await MockTokenFactory.deploy('LPToken', 'LP1', 1000000);
    this.lp2 = await MockTokenFactory.deploy('LPToken', 'LP2', 1000000);
    this.lp3 = await MockTokenFactory.deploy('LPToken', 'LP3', 1000000);

    const BarberContract = await ethers.getContractFactory('Barber');

    this.barber = await BarberContract.deploy(this.hairToken.address, dev.address, fee.address, 1000, 100);

    // add the hair pool
    await this.barber.add(1000, this.hairToken.address, 0, true);

    await this.hairToken.transferOwnership(this.barber.address);

    await this.lp1.transfer(bob.address, 2000);
    await this.lp2.transfer(bob.address, 2000);
    await this.lp3.transfer(bob.address, 2000);

    await this.lp1.transfer(alice.address, 2000);
    await this.lp2.transfer(alice.address, 2000);
    await this.lp3.transfer(alice.address, 2000);
  });

  it('real case', async () => {
    this.lp4 = await MockTokenFactory.deploy('LPToken', 'LP4', 1000000);
    this.lp5 = await MockTokenFactory.deploy('LPToken', 'LP5', 1000000);
    this.lp6 = await MockTokenFactory.deploy('LPToken', 'LP6', 1000000);
    this.lp7 = await MockTokenFactory.deploy('LPToken', 'LP7', 1000000);
    this.lp8 = await MockTokenFactory.deploy('LPToken', 'LP8', 1000000);
    this.lp9 = await MockTokenFactory.deploy('LPToken', 'LP9', 1000000);

    await this.barber.add(2000, this.lp1.address, 0, true);
    await this.barber.add(1000, this.lp2.address, 0, true);
    await this.barber.add(500, this.lp3.address, 0, true);
    await this.barber.add(500, this.lp4.address, 0, true);
    await this.barber.add(500, this.lp5.address, 0, true);
    await this.barber.add(500, this.lp6.address, 0, true);
    await this.barber.add(500, this.lp7.address, 0, true);
    await this.barber.add(100, this.lp8.address, 0, true);
    await this.barber.add(100, this.lp9.address, 0, true);

    await time.advanceBlockTo(170);

    expect(await this.barber.poolLength()).to.equal(10);
    expect(await this.hairToken.balanceOf(alice.address)).to.equal(0);

    await this.lp1.connect(alice).approve(this.barber.address, 1000);
    expect(await this.barber.connect(alice).deposit(1, 20)).to.emit(this.barber, 'Deposit');
    expect(await this.barber.connect(alice).withdraw(1, 20)).to.emit(this.barber, 'Withdraw');

    expect(await this.hairToken.balanceOf(alice.address)).to.equal(298);
  });

  it('deposit/withdraw', async () => {
    await this.barber.add(1000, this.lp1.address, 0, true);
    await this.barber.add(1000, this.lp2.address, 0, true);
    await this.barber.add(1000, this.lp3.address, 0, true);

    expect(await this.lp1.balanceOf(alice.address)).to.equal(2000);

    await this.lp1.connect(alice).approve(this.barber.address, 100);
    await this.barber.connect(alice).deposit(1, 20);
    await this.barber.connect(alice).deposit(1, 0);
    await this.barber.connect(alice).deposit(1, 40);
    await this.barber.connect(alice).deposit(1, 0);

    expect(await this.lp1.balanceOf(alice.address)).to.equal(1940);

    await this.barber.connect(alice).withdraw(1, 10);
    expect(await this.lp1.balanceOf(alice.address)).to.equal(1950);
    expect(await this.hairToken.balanceOf(alice.address)).to.equal(999);
    expect(await this.hairToken.balanceOf(dev.address)).to.equal(100);

    await this.lp1.connect(bob).approve(this.barber.address, 100);
    expect(await this.lp1.balanceOf(bob.address)).to.equal(2000);

    await this.barber.connect(bob).deposit(1, 50);
    expect(await this.lp1.balanceOf(bob.address)).to.equal(1950);

    await this.barber.connect(bob).deposit(1, 0);
    expect(await this.hairToken.balanceOf(bob.address)).to.equal(125);

    expect(await this.barber.connect(bob).emergencyWithdraw(1)).to.emit(this.barber, 'EmergencyWithdraw');
    expect(await this.lp1.balanceOf(bob.address)).to.equal(2000);
  });

  it('the barber is the owner of hair', async () => {
    expect(await this.hairToken.owner()).to.equal(this.barber.address);
  });

  it('should allow dev and only dev to update dev', async () => {
    expect((await this.barber.devAddress()).valueOf()).to.equal(dev.address);

    await expectRevert(this.barber.connect(alice).setDevAddress(bob.address), 'dev: wut?');
    await this.barber.connect(dev).setDevAddress(bob.address);

    expect((await this.barber.devAddress()).valueOf()).to.equal(bob.address);
    expect(await this.barber.connect(bob).setDevAddress(alice.address)).to.emit(this.barber, 'SetDevAddress');
    expect((await this.barber.devAddress()).valueOf()).to.equal(alice.address);
  });

  it('can update the emissions rate', async () => {
    // barber_toRemove:: - this should end up changing to whatever we decide to do at launch!
    expect(await this.barber.hairPerBlock()).to.equal(1000);
    expect(await this.barber.updateEmissionRate(420)).to.emit(this.barber, 'UpdateEmissionRate');
    expect(await this.barber.hairPerBlock()).to.equal(420);
  });

  it('can change the fee address', async () => {
    expect(await this.barber.feeAddress()).to.equal(fee.address);
    expect(await this.barber.setFeeAddress(bob.address)).to.emit(this.barber, 'SetFeeAddress');
    expect(await this.barber.feeAddress()).to.equal(bob.address);
  });

  it('there cannot be duplicate pools', async () => {
    await expectRevert(this.barber.add(1000, this.hairToken.address, 0, true), 'nonDuplicated: duplicated');
  });
});
