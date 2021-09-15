const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber: BN } = require('@ethersproject/bignumber');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const maxAllowance = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

describe('Bulletin', function () {
  let HairToken;
  let Bulletin;
  let hairToken;
  let bulletin;

  let alice;
  let bob;
  let carol;
  let dan;
  let deployer;

  beforeEach(async () => {
    ({ deployer, alice, bob, carol, dan } = await ethers.getNamedSigners());

    HairToken = await ethers.getContractFactory('HairToken');
    hairToken = await HairToken.deploy();

    await hairToken.deployed();

    await hairToken.mint(alice.address, BN.from(1000000).mul(BN.from(String(10 ** 18))));
    await hairToken.mint(bob.address, BN.from(1000000).mul(BN.from(String(10 ** 18))));
    await hairToken.mint(carol.address, BN.from(1000000).mul(BN.from(String(10 ** 18))));

    Bulletin = await ethers.getContractFactory('Bulletin');
    bulletin = await Bulletin.deploy(hairToken.address, 2);

    await bulletin.deployed();

    await hairToken.connect(alice).approve(bulletin.address, maxAllowance);
    await hairToken.connect(bob).approve(bulletin.address, maxAllowance);
    await hairToken.connect(carol).approve(bulletin.address, maxAllowance);
  });

  describe('The contract basics', () => {
    it('Should set the right owner', async function () {
      expect(await bulletin.owner()).to.equal(deployer.address);
    });

    it('Starts at level 1', async function () {
      expect(await bulletin.currentLevel()).to.equal(1);
    });

    it('Starting rate is 100 hair', async function () {
      const startingRate = BN.from(100).mul(BN.from(String(10 ** 18)));
      expect(await bulletin.currentRate()).to.equal(startingRate);
    });

    it('Initially no tokens are burned', async function () {
      expect(await bulletin.totalHairBurned()).to.equal(0);
    });
  });

  describe('Buying a square', () => {
    it('Without HAIR in wallet the transaction fails', async function () {
      await hairToken.connect(dan).approve(bulletin.address, maxAllowance);

      expect(await hairToken.balanceOf(dan.address)).to.equal(0);

      await expectRevert(bulletin.connect(dan).buySquare(
        0,
        '',
        '',
        '',
      ), 'ERC20: transfer amount exceeds balance');

      expect(await hairToken.balanceOf(dan.address)).to.equal(0);
    });

    it('When text is too long it will fail', async function () {
      await expectRevert(bulletin.connect(alice).buySquare(
        0,
        // eslint-disable-next-line max-len
        'abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz',
        '',
        '',
      ), 'text over 152 char limit');
    });

    it('Claiming a square without any params is ok', async function () {
      await hairToken.connect(alice).approve(bulletin.address, maxAllowance);
      await hairToken.connect(bob).approve(bulletin.address, maxAllowance);

      expect(await bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      )).to.emit(bulletin, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(String(100 * 10 ** 18)));
    });

    it('Only one owner of a square', async function () {
      expect(await bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      )).to.emit(bulletin, 'SquarePurchased');

      await expectRevert(bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      ), 'invalid square: already claimed');

      await expectRevert(bulletin.connect(bob).buySquare(
        0,
        '',
        '',
        '',
      ), 'invalid square: already claimed');
    });

    it('A user can buy multiple squares on the same level', async function () {
      expect(await bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      )).to.emit(bulletin, 'SquarePurchased');

      await time.advanceBlock();

      expect(await bulletin.connect(alice).buySquare(
        1,
        '',
        '',
        '',
      )).to.emit(bulletin, 'SquarePurchased');
    });

    it('Passing calldata for the square', async function () {
      expect(await bulletin.connect(alice).buySquare(
        0,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.currentLevel()).to.equal(1);

      const square = await bulletin.squares(0);
      expect(square[0]).to.equal(0);
      expect(square[1]).to.equal(alice.address);
      expect(square[2]).to.equal('100000000000000000000');
      expect(square[3]).to.equal('a message');
      expect(square[4]).to.equal('https://picsum.photos/200/300');
      expect(square[5]).to.equal('https://barbershop.finance');
    });
  });

  describe('Handles multiple levels', () => {
    it('Cannot buy on a level not yet reached', async function () {
      await expectRevert(bulletin.connect(alice).buySquare(
        3,
        '',
        '',
        '',
      ), 'invalid square: level not started');
    });

    it('Burn price raises each level', async function () {
      const burnAddress = '0x000000000000000000000000000000000000dEaD';
      expect(await hairToken.balanceOf(burnAddress)).to.equal(BN.from(0));
      expect(await bulletin.connect(alice).buySquare(
        0,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(String(100 * 10 ** 18)));

      expect(await bulletin.connect(bob).buySquare(
        1,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(String(200 * 10 ** 18)));

      expect(await bulletin.connect(carol).buySquare(
        2,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(1200).mul(String(10 ** 18)));

      expect(await bulletin.connect(carol).buySquare(
        3,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(2200).mul(String(10 ** 18)));

      // can buy any square on level (ie. 5 before 4)
      expect(await bulletin.connect(carol).buySquare(
        5,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(12200).mul(String(10 ** 18)));

      expect(await bulletin.connect(carol).buySquare(
        4,
        'a message',
        'https://picsum.photos/200/300',
        'https://barbershop.finance',
      )).to.emit(bulletin.address, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(22200).mul(String(10 ** 18)));
      expect(await hairToken.balanceOf(burnAddress)).to.equal(BN.from(22200).mul(String(10 ** 18)));
    });
  });

  describe('A malicious user can be banned', () => {
    it('Can add user to blocklist', async function () {
      expect(await bulletin.connect(deployer).addToBlocklist(alice.address)).to.emit(bulletin, 'UserBanned');

      await expectRevert(bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      ), 'blocklist: address not allowed');
    });
  });
});
