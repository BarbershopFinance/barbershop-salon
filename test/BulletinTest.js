const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber: BN } = require('@ethersproject/bignumber');
const { expectRevert } = require('@openzeppelin/test-helpers');

const maxAllowance = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

describe('Bulletin', function () {
  let HairToken;
  let Bulletin;
  let hairToken;
  let bulletin;

  let alice;
  let bob;
  let carol;
  let deployer;

  beforeEach(async () => {
    ({ deployer, dev, fee, alice, bob, carol } = await ethers.getNamedSigners());

    HairToken = await ethers.getContractFactory('HairToken');
    hairToken = await HairToken.deploy();

    await hairToken.deployed();

    await hairToken.mint(alice.address, BN.from(10000).mul(BN.from(String(10 ** 18))));

    Bulletin = await ethers.getContractFactory('Bulletin');
    bulletin = await Bulletin.deploy(hairToken.address, 2);

    await bulletin.deployed();

    await hairToken.connect(alice).approve(bulletin.address, maxAllowance);
  });

  // describe('The contract basics', () => {
  //   it('Should set the right owner', async function () {
  //     expect(await bulletin.owner()).to.equal(deployer.address);
  //   });

  //   it('Starts at level 0', async function () {
  //     expect(await bulletin.numLevels()).to.equal(0);
  //   });

  //   it('Starting rate is 100 hair', async function () {
  //     const startingRate = BN.from(100).mul(BN.from(String(10 ** 18)));
  //     expect(await bulletin.currentRate()).to.equal(startingRate);
  //   });

  //   it('Initially no tokens are burned', async function () {
  //     expect(await bulletin.totalHairBurned()).to.equal(0);
  //   });
  // });

  describe('Buying a square', () => {
    // it('When text is too long it will fail', async function () {
    //   await hairToken.connect(alice).approve(bulletin.address, maxAllowance);

    //   await expectRevert(bulletin.connect(alice).buySquare(
    //     0,
    //     // eslint-disable-next-line max-len
    //     'abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz abcdefg hijklmnop qrstuvw xyz',
    //     '',
    //     '',
    //   ), 'text over 152 char limit');
    // });

    it('Claiming a square without any params is ok', async function () {
      await hairToken.connect(alice).approve(bulletin.address, maxAllowance);

      expect(await bulletin.connect(alice).buySquare(
        0,
        '',
        '',
        '',
      )).to.emit(bulletin, 'SquarePurchased');

      expect(await bulletin.totalHairBurned()).to.equal(BN.from(String(100 * 10 ** 18)));

      // await expectRevert(bulletin.connect(alice).buySquare(
      //   1,
      //   '',
      //   '',
      //   '',
      // ), 'one square per level per address');

      // expect(await bulletin.totalHairBurned()).to.equal(BN.from(String(100 * 10 ** 18)));
    });

    // it('Happy path', async function () {
    //   await hairToken.connect(alice).approve(bulletin.address, maxAllowance);

    //   expect(await this.barber.connect(alice).deposit(1, 20)).to.emit(this.barber, 'Deposit');
    //   expect(await bulletin.connect(alice).buySquare(
    //     0,
    //     'my message',
    //     'https://picsum.photos/200/300',
    //     'https://barbershop.finance',
    //   ).to.emit(bulletin.address, 'SquarePurchased'));

    //   expect(await bulletin.totalHairBurned()).to.equal(0);
    // });
  });

  // describe('Supply', () => {
  //   context('When there is no supply', () => {
  //     it('Returns zero', async () => {
  //       expect(await hairToken.totalSupply()).to.be.equal(0);
  //     });
  //   });

  //   context('Shen there is some supply', () => {
  //     const amount = ethers.BigNumber.from(10e9);

  //     beforeEach('mint tokens', async () => {
  //       await hairToken.functions['mint(address,uint256)'](alice.address, amount);
  //       await hairToken.functions['mint(address,uint256)'](bob.address, amount);
  //     });

  //     it('returns the existing supply', async () => {
  //       expect(await hairToken.totalSupply()).to.be.equal(amount.mul(2));
  //     });
  //   });
  // });
});
