const { expect } = require('chai');
const { ethers } = require('hardhat');

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

    Bulletin = await ethers.getContractFactory('Bulletin');
    bulletin = await Bulletin.deploy(hairToken.address);

    await bulletin.deployed();
  });

  describe('The contract basics', () => {
    it('Should set the right owner', async function () {
      expect(await bulletin.owner()).to.equal(deployer.address);
    });
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
