/* eslint-disable max-len */
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { ethers } = require('hardhat');
const { expect } = require('chai');
const { BigNumber: BN } = require('@ethersproject/bignumber');

describe('HairPool', function (...args) {
  let dev;
  let deployer;
  let alice;
  let bob;
  let carol;

  beforeEach(async () => {
    ({ deployer, dev, alice, bob, carol } = await ethers.getNamedSigners());

    // Hair token
    const HairToken = await ethers.getContractFactory('HairToken');
    this.hairToken = await HairToken.deploy();

    // Earning token
    const MockTokenFactory = await ethers.getContractFactory('MockERC20', deployer);
    this.earningToken = await MockTokenFactory.deploy('EarningToken', 'E1', 1000000);

    // HairPool contract
    this.HairPoolContract = await ethers.getContractFactory('HairPool');

    // Setup dev for reward deposits
    await this.earningToken.transfer(dev.address, 1000);
  });

  it('Can deposit rewards into the contract', async () => {
    const startBlock = (await time.latestBlock()).toNumber();
    const endBlock = startBlock + 100;
    const pool = await this.HairPoolContract.deploy(
      this.hairToken.address,
      this.earningToken.address,
      1,
      startBlock,
      endBlock,
    );
    await this.earningToken.connect(dev).approve(pool.address, 1000);

    expect(await pool.rewardBalance()).to.equal(0);

    await pool.connect(dev).depositRewards(1000);

    expect(await pool.rewardBalance()).to.equal(1000);
  });

  // Note: here and the rest of the tests, we pick a start block
  // based on current block, and jump forward 100 blocks to ensure we've handled
  // all test and contract setup which takes a few blocks there might be a better
  // way to setup the hardhat test environment to restart from block 0
  // for each test but this way each test can be run at any point in time
  it('If only alice deposits hair token, she would earn the entire pool', async () => {
    const currentBlock = (await time.latestBlock()).toNumber();
    const startBlock = currentBlock + 100;
    const endBlock = startBlock + 50;

    const pool = await this.HairPoolContract.deploy(
      this.hairToken.address,
      this.earningToken.address,
      1,
      startBlock,
      endBlock,
    );
    await pool.deployed();

    await this.earningToken.connect(dev).approve(pool.address, 50);
    await pool.connect(dev).depositRewards(50);
    await this.hairToken.mint(alice.address, 1000);
    await this.hairToken.connect(alice).approve(pool.address, 1000);
    await pool.connect(alice).deposit(100);

    await time.advanceBlockTo(startBlock);

    expect(await pool.pendingReward(alice.address)).to.equal(0);
    expect(await pool.rewardBalance()).to.equal(50);

    await time.advanceBlockTo(endBlock);

    expect(await pool.pendingReward(alice.address)).to.equal(50);

    await expectRevert(pool.connect(alice).withdraw(101), 'Withdraw amount exceeds balance');

    expect(await pool.connect(alice).withdraw(100)).to.emit(pool, 'Withdraw');
    expect(await pool.pendingReward(alice.address)).to.equal(0);
    expect(await pool.rewardBalance()).to.equal(0);
  });

  it('Two users who deposit at the same time would split the pool based on their share of the total staked hair', async () => {
    const currentBlock = (await time.latestBlock()).toNumber();
    const startBlock = currentBlock + 100;
    const endBlock = startBlock + 50;

    const pool = await this.HairPoolContract.deploy(
      this.hairToken.address,
      this.earningToken.address,
      2,
      startBlock,
      endBlock,
    );
    await pool.deployed();

    await this.earningToken.connect(dev).approve(pool.address, 100);
    await pool.connect(dev).depositRewards(100);

    // Bob deposits 2x the amount of hair Alice does
    await this.hairToken.mint(alice.address, 1000);
    await this.hairToken.mint(bob.address, 2000);
    await this.hairToken.connect(alice).approve(pool.address, 1000);
    await this.hairToken.connect(bob).approve(pool.address, 2000);
    expect(await pool.connect(alice).deposit(1000)).to.emit(pool, 'Deposit');
    expect(await pool.connect(bob).deposit(2000)).to.emit(pool, 'Deposit');

    await time.advanceBlockTo(startBlock);

    expect(await pool.pendingReward(alice.address)).to.equal(0);
    expect(await pool.pendingReward(bob.address)).to.equal(0);
    expect(await pool.rewardBalance()).to.equal(100);

    await time.advanceBlockTo(endBlock);

    expect(await pool.pendingReward(alice.address)).to.equal(33);
    expect(await pool.pendingReward(bob.address)).to.equal(66);

    expect(await pool.connect(alice).withdraw(1000)).to.emit(pool, 'Withdraw');
    expect(await pool.connect(bob).withdraw(2000)).to.emit(pool, 'Withdraw');

    expect(await this.earningToken.balanceOf(alice.address)).to.equal(33);
    expect(await this.earningToken.balanceOf(bob.address)).to.equal(66);
  });

  it('More complex scenario', async () => {
    const currentBlock = (await time.latestBlock()).toNumber();
    const startBlock = currentBlock + 100;
    const endBlock = startBlock + 10;

    const pool = await this.HairPoolContract.deploy(
      this.hairToken.address,
      this.earningToken.address,
      10,
      startBlock,
      endBlock,
    );
    await pool.deployed();

    await this.earningToken.connect(dev).approve(pool.address, 100);
    await pool.connect(dev).depositRewards(100);

    // Bob deposits 2x the amount of hair Alice does
    // Carol deposits 4x the amount of hair Alice does, and 2x of Bob
    await this.hairToken.mint(alice.address, 1000);
    await this.hairToken.connect(alice).approve(pool.address, 1000);
    await this.hairToken.mint(bob.address, 2000);
    await this.hairToken.connect(bob).approve(pool.address, 2000);
    await this.hairToken.mint(carol.address, 4000);
    await this.hairToken.connect(carol).approve(pool.address, 4000);

    expect(await pool.rewardBalance()).to.equal(100);
    expect(await pool.connect(alice).deposit(1000)).to.emit(pool, 'Deposit');

    await time.advanceBlockTo(startBlock);

    // everyone starts at 0
    expect(await pool.pendingReward(alice.address)).to.equal(0);
    expect(await pool.pendingReward(bob.address)).to.equal(0);
    expect(await pool.pendingReward(carol.address)).to.equal(0);
    expect(await pool.totalStaked()).to.equal(1000);

    // advance 2 blocks
    await time.advanceBlockTo(startBlock + 2);

    // alice is the only one staked, she earns all rewards
    expect(await pool.pendingReward(alice.address)).to.equal(20);
    expect(await pool.pendingReward(bob.address)).to.equal(0);
    expect(await pool.pendingReward(carol.address)).to.equal(0);

    // bob deposits all his hair, giving him a ~66% stake of the pool
    expect(await pool.connect(bob).deposit(2000)).to.emit(pool, 'Deposit');
    expect(await pool.pendingReward(alice.address)).to.equal(30, 'Alice earned 10 more on the block bob deposited');
    expect(await pool.totalStaked()).to.equal(3000);

    await time.advanceBlock();

    expect(await pool.pendingReward(alice.address)).to.equal(33);
    expect(await pool.pendingReward(bob.address)).to.equal(6);

    await time.advanceBlock();

    expect(await pool.pendingReward(alice.address)).to.equal(36);
    expect(await pool.pendingReward(bob.address)).to.equal(13);

    // carol deposits all her hair, giving her ~57% stake of the pool
    expect(await pool.connect(carol).deposit(4000)).to.emit(pool, 'Deposit');

    expect(await pool.totalStaked()).to.equal(7000);
    expect(await pool.pendingReward(alice.address)).to.equal(40);
    expect(await pool.pendingReward(bob.address)).to.equal(20);
    expect(await pool.pendingReward(carol.address)).to.equal(0);

    // Bob withdraws half
    expect(await pool.pendingReward(bob.address)).to.equal(20);
    expect(await pool.connect(bob).withdraw(1000)).to.emit(pool, 'Withdraw');
    expect(await this.earningToken.balanceOf(bob.address)).to.equal(22);
    expect(await pool.totalStaked()).to.equal(6000);

    await time.advanceBlockTo(endBlock);

    expect(await pool.pendingReward(alice.address)).to.equal(46);
    expect(await pool.pendingReward(bob.address)).to.equal(5);
    expect(await pool.pendingReward(carol.address)).to.equal(25);

    // Alice and Carol withdraw everything
    expect(await pool.connect(alice).withdraw(1000)).to.emit(pool, 'Withdraw');
    expect(await pool.connect(carol).withdraw(4000)).to.emit(pool, 'Withdraw');
    expect(await this.earningToken.balanceOf(alice.address)).to.equal(46);
    expect(await this.earningToken.balanceOf(carol.address)).to.equal(25);

    // Bob still has some in
    expect(await pool.totalStaked()).to.equal(1000);
    expect(await pool.pendingReward(bob.address)).to.equal(5);
  });
});
