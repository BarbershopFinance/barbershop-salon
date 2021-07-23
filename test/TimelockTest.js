const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const { expect } = require('chai');

function encodeParameters (types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

describe('Timelock', function () {
  let dev;
  let deployer;
  let fee;
  let alice;
  let bob;
  let carol;

  beforeEach(async () => {
    ({ deployer, dev, fee, alice, bob, carol } = await ethers.getNamedSigners());

    const HairToken = await ethers.getContractFactory('HairToken');
    this.hairToken = await HairToken.connect(alice).deploy();

    const Timelock = await ethers.getContractFactory('Timelock');
    this.timelock = await Timelock.connect(alice).deploy(bob.address, 50400); // 14 hours

    await this.hairToken.deployed();
    await this.timelock.deployed();
  });

  it('should not allow non-owner to do operation', async () => {
    await this.hairToken.connect(alice).transferOwnership(this.timelock.address);
    await expectRevert(
      this.hairToken.connect(alice).transferOwnership(carol.address),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.hairToken.connect(bob).transferOwnership(carol.address),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.timelock.connect(alice).queueTransaction(
        this.hairToken.address, 0, 'transferOwnership(address)',
        encodeParameters(['address'], [carol.address]),
        (await time.latest()).add(time.duration.hours(6)).toNumber(),
      ),
      'Timelock::queueTransaction: Call must come from admin.',
    );
  });

  it('should do the timelock thing', async () => {
    await this.hairToken.connect(alice).transferOwnership(this.timelock.address);

    const eta = (await time.latest()).add(time.duration.hours(15)).toNumber();

    await this.timelock.connect(bob).queueTransaction(
      this.hairToken.address, 0, 'transferOwnership(address)',
      encodeParameters(['address'], [carol.address]), eta,
    );
    await time.increase(time.duration.hours(1));
    await expectRevert(
      this.timelock.connect(bob).executeTransaction(
        this.hairToken.address, 0, 'transferOwnership(address)',
        encodeParameters(['address'], [carol.address]), eta,
      ),
      'Timelock::executeTransaction: Transaction hasn\'t surpassed time lock.',
    );
    await time.increase(time.duration.hours(14));
    await this.timelock.connect(bob).executeTransaction(
      this.hairToken.address, 0, 'transferOwnership(address)',
      encodeParameters(['address'], [carol.address]), eta,
    );
    expect((await this.hairToken.owner()).valueOf()).to.equal(carol.address);
  });

  it('should also work with Barber', async () => {
    const MockTokenFactory = await ethers.getContractFactory('MockERC20', deployer);

    this.lp1 = await MockTokenFactory.deploy('LPToken', 'LP1', 10000000000);
    this.lp2 = await MockTokenFactory.deploy('LPToken', 'LP2', 10000000000);

    const BarberContract = await ethers.getContractFactory('Barber');
    this.barber = await BarberContract.connect(alice).deploy(this.hairToken.address, dev.address, fee.address, 10, 0);

    await this.hairToken.connect(alice).transferOwnership(this.barber.address);
    await this.barber.connect(alice).add(100, this.lp1.address, 0, true);
    await this.barber.connect(alice).transferOwnership(this.timelock.address);
    await expectRevert(
      this.barber.connect(alice).add(100, this.lp1.address, 0, true),
      'Ownable: caller is not the owner',
    );

    const eta = (await time.latest()).add(time.duration.hours(15)).toNumber();

    await this.timelock.connect(bob).queueTransaction(
      this.barber.address, 0, 'transferOwnership(address)',
      encodeParameters(['address'], [deployer.address]), eta,
    );
    await time.increase(time.duration.hours(15));
    await this.timelock.connect(bob).executeTransaction(
      this.barber.address, 0, 'transferOwnership(address)',
      encodeParameters(['address'], [deployer.address]), eta,
    );
    await expectRevert(
      this.barber.connect(alice).add(100, this.lp1.address, 0, true),
      'Ownable: caller is not the owner',
    );
    await expectRevert(
      this.barber.connect(deployer).add(100, this.lp1.address, 0, true),
      'nonDuplicated: duplicated',
    );
    await this.barber.connect(deployer).add(100, this.lp2.address, 0, true);
  });
});
