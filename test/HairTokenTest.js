const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('HairToken', function () {
  let HairToken;
  let hairToken;
  let alice;
  let bob;
  let carol;
  let deployer;

  beforeEach(async () => {
    ({ deployer, dev, fee, alice, bob, carol } = await ethers.getNamedSigners());

    HairToken = await ethers.getContractFactory('HairToken');
    hairToken = await HairToken.deploy();

    await hairToken.deployed();
  });

  describe('The contract basics', () => {
    it('Should set the right owner', async function () {
      expect(await hairToken.owner()).to.equal(deployer.address);
    });

    it('The contract is 18 decimals', async function () {
      await hairToken.deployed();

      expect(await hairToken.decimals()).to.equal(18);
    });

    it('The token is named `Hair Token`', async function () {
      await hairToken.deployed();

      expect(await hairToken.name()).to.equal('Hair Token');
    });

    it('Token symbol is HAIR', async function () {
      await hairToken.deployed();

      expect(await hairToken.symbol()).to.equal('HAIR');
    });

    it('Can mint tokens to users', async function () {
      expect(await hairToken.balanceOf(alice.address)).to.equal(0);
      expect(await hairToken.balanceOf(bob.address)).to.equal(0);

      await hairToken.mint(alice.address, 125);

      expect(await hairToken.balanceOf(alice.address), 125);
      expect(await hairToken.balanceOf(bob.address), 0);

      await hairToken.mint(bob.address, 5000);

      expect(await hairToken.totalSupply()).to.equal(5125);
      expect(await hairToken.balanceOf(alice.address), 125);
      expect(await hairToken.balanceOf(bob.address), 5000);
      expect(await hairToken.balanceOf(deployer.address)).to.equal(0);
    });
  });

  describe('Supply', () => {
    context('When there is no supply', () => {
      it('Returns zero', async () => {
        expect(await hairToken.totalSupply()).to.be.equal(0);
      });
    });

    context('Shen there is some supply', () => {
      const amount = ethers.BigNumber.from(10e9);

      beforeEach('mint tokens', async () => {
        await hairToken.functions['mint(address,uint256)'](alice.address, amount);
        await hairToken.functions['mint(address,uint256)'](bob.address, amount);
      });

      it('returns the existing supply', async () => {
        expect(await hairToken.totalSupply()).to.be.equal(amount.mul(2));
      });
    });
  });

  describe('Delegation power attack', async function () {
    it('should multiply delegation power on transfers', async function () {
      await hairToken.mint(deployer.address, 100);
      await hairToken.delegate(carol.address);
      await hairToken.transfer(alice.address, 100);
      await hairToken.connect(alice).delegate(carol.address);
      await hairToken.connect(alice).transfer(bob.address, 100);
      await hairToken.connect(bob).delegate(carol.address);
      const votes = await hairToken.getCurrentVotes(carol.address);
      console.log('votes', votes.toString());
    });
  });
});
