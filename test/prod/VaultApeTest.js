const { ethers } = require('hardhat');
const { expect } = require('chai');
const { addressBook } = require('blockchain-addressbook');
const barbershopConfig = require('../../config/vaults/barbershop');

const { zapNativeToToken, getVaultWant, unpauseIfPaused, getUnirouterData } = require('../utils/testHelpers');
const { delay } = require('../utils/timeHelpers');

const TIMEOUT = 10 * 60 * 100000;

const chainName = 'polygon';
const chainData = addressBook[chainName];

const maxAllowance = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const config = {
  vaultAddress: '0x650bF196E63016dbE6B784fAa7A8a62d28CcBE7a',
  strategyAddress: '0x2Ea9EF8Cb3A3ABBD65cd57E1EEe83f50d9CF8D38',
  vaultContractName: 'VaultBarber',
  strategyContractName: 'StrategyApeSwapLP',
  testAmount: ethers.utils.parseEther('0.1'),
  wnative: chainData.tokens.WNATIVE.address,
  keeper: barbershopConfig.keeper,
  strategyOwner: barbershopConfig.strategyOwner,
  vaultOwner: barbershopConfig.vaultOwner,
};

describe('VaultDeployedCorrectlyTest', () => {
  let vault, strategy, keeper, other;

  beforeEach(async () => {
    [deployer, keeper, other] = await ethers.getSigners();

    vault = await ethers.getContractAt(config.vaultContractName, config.vaultAddress);

    // console.log('finding strat')
    const strategyAddr = await vault.strategy();

    // console.log('stratAddr', strategyAddr)
    strategy = await ethers.getContractAt(config.strategyContractName, strategyAddr);

    // const unirouterAddr = await strategy.unirouter();
    // const unirouterData = getUnirouterData(unirouterAddr);
  });

  // it.only('Strategy matches', async () => {
  //   // await unpauseIfPaused(strategy, keeper);

  //   const strategyAddr = await vault.strategy();

  //   expect(strategyAddr).to.eq(config.strategyAddress);
  // }).timeout(TIMEOUT);

  it('Want is correct', async () => {
    // await unpauseIfPaused(strategy, keeper);

    const wantAddr = await vault.want();

    expect(wantAddr).to.equal('0xe82635a105c520fd58e597181cBf754961d51E3e');
  });

  // it.only('It has the correct owners and keeper.', async () => {
  //   const vaultOwner = await vault.owner();
  //   const stratOwner = await strategy.owner();
  //   const stratKeeper = await strategy.keeper();
  //   console.log({ config });

  //   expect(vaultOwner).to.equal(config.vaultOwner);
  //   expect(stratOwner).to.equal(config.strategyOwner);
  //   expect(stratKeeper).to.equal(config.keeper);
  // }).timeout(TIMEOUT);

  it('Has correct call fee', async () => {
    const callFee = await strategy.callFee();

    const expectedCallFee = 111;
    const actualCallFee = parseInt(callFee)

    expect(actualCallFee).to.equal(expectedCallFee);
  }).timeout(TIMEOUT);

  it.only('Vault and strat references are correct', async () => {
    const stratReference = await vault.strategy();
    const vaultReference = await strategy.vault();

    console.log(strategy.address);
    console.log(vault.address);
    expect(stratReference).to.equal(ethers.utils.getAddress(strategy.address));
    expect(vaultReference).to.equal(ethers.utils.getAddress(vault.address));
  }).timeout(TIMEOUT);
});

describe('VaultLifecycleTest', () => {
  let vault, strategy, unirouter, want, deployer, keeper, other;

  beforeEach(async () => {
    [deployer, keeper, other] = await ethers.getSigners();

    vault = await ethers.getContractAt(config.vaultContractName, config.vaultAddress);

    console.log('finding strat')
    const strategyAddr = await vault.strategy();

    console.log('stratAddr', strategyAddr)
    strategy = await ethers.getContractAt(config.strategyContractName, strategyAddr);

    const unirouterAddr = await strategy.unirouter();
    const unirouterData = getUnirouterData(unirouterAddr);

    unirouter = await ethers.getContractAt(unirouterData.interface, unirouterAddr);

    want = await getVaultWant(vault, config.wnative);

    console.log('want', want)
    console.log('config', config)
    const zapRes = await zapNativeToToken({
      amount: config.testAmount,
      want,
      nativeTokenAddr: config.wnative,
      unirouter,
      swapSignature: unirouterData.swapSignature,
      recipient: deployer.address,
    });

    console.log('result of zap: ', zapRes);

    console.log('want: ', want)

    const wantBal = await want.balanceOf(deployer.address);
    await want.transfer(other.address, wantBal.div(2));
  });

  it('User can deposit and withdraw from the vault.', async () => {
    await unpauseIfPaused(strategy, keeper);

    const wantBalStart = await want.balanceOf(deployer.address);

    await want.approve(vault.address, wantBalStart);
    await vault.depositAll();
    await vault.withdrawAll();

    const wantBalFinal = await want.balanceOf(deployer.address);

    expect(wantBalFinal).to.be.lte(wantBalStart);
    expect(wantBalFinal).to.be.gt(wantBalStart.mul(99).div(100));
  }).timeout(TIMEOUT);

  it('Harvests work as expected.', async () => {
    await unpauseIfPaused(strategy, keeper);

    const wantBalStart = await want.balanceOf(deployer.address);
    await want.approve(vault.address, wantBalStart);
    await vault.depositAll();

    const vaultBal = await vault.balance();
    const pricePerShare = await vault.getPricePerFullShare();
    await delay(5000);
    const callRewardBeforeHarvest = await strategy.callReward();
    expect(callRewardBeforeHarvest).to.be.gt(0);
    await strategy.harvest({ gasPrice: 5000000 });
    const vaultBalAfterHarvest = await vault.balance();
    const pricePerShareAfterHarvest = await vault.getPricePerFullShare();
    const callRewardAfterHarvest = await strategy.callReward();

    await vault.withdrawAll();
    const wantBalFinal = await want.balanceOf(deployer.address);

    expect(vaultBalAfterHarvest).to.be.gt(vaultBal);
    expect(pricePerShareAfterHarvest).to.be.gt(pricePerShare);
    expect(callRewardBeforeHarvest).to.be.gt(callRewardAfterHarvest);
    
    expect(wantBalFinal).to.be.gt(wantBalStart.mul(99).div(100));

    const lastHarvest = await strategy.lastHarvest();
    expect(lastHarvest).to.be.gt(0);
  }).timeout(TIMEOUT);

  it('Manager can panic.', async () => {
    await unpauseIfPaused(strategy, keeper);

    const wantBalStart = await want.balanceOf(deployer.address);
    await want.approve(vault.address, wantBalStart);
    await vault.depositAll();

    const vaultBal = await vault.balance();
    const balOfPool = await strategy.balanceOfPool();
    const balOfWant = await strategy.balanceOfWant();
    await strategy.connect(keeper).panic();
    const vaultBalAfterPanic = await vault.balance();
    const balOfPoolAfterPanic = await strategy.balanceOfPool();
    const balOfWantAfterPanic = await strategy.balanceOfWant();

    expect(vaultBalAfterPanic).to.be.gt(vaultBal.mul(99).div(100));
    expect(balOfPool).to.be.gt(balOfWant);
    expect(balOfWantAfterPanic).to.be.gt(balOfPoolAfterPanic);

    // Users can't deposit.
    const tx = vault.depositAll();
    await expect(tx).to.be.revertedWith('Pausable: paused');

    // User can still withdraw
    await vault.withdrawAll();
    const wantBalFinal = await want.balanceOf(deployer.address);
    expect(wantBalFinal).to.be.gt(wantBalStart.mul(99).div(100));
  }).timeout(TIMEOUT);

  it("New user deposit/withdrawals don't lower other users balances.", async () => {
    await unpauseIfPaused(strategy, keeper);

    const wantBalStart = await want.balanceOf(deployer.address);
    await want.approve(vault.address, wantBalStart);
    await vault.depositAll();

    const pricePerShare = await vault.getPricePerFullShare();
    const wantBalOfOther = await want.balanceOf(other.address);
    await want.connect(other).approve(vault.address, wantBalOfOther);
    await vault.connect(other).depositAll();
    const pricePerShareAfterOtherDeposit = await vault.getPricePerFullShare();

    await vault.withdrawAll();
    const wantBalFinal = await want.balanceOf(deployer.address);
    const pricePerShareAfterWithdraw = await vault.getPricePerFullShare();

    expect(pricePerShareAfterOtherDeposit).to.be.gte(pricePerShare);
    expect(pricePerShareAfterWithdraw).to.be.gte(pricePerShareAfterOtherDeposit);
    expect(wantBalFinal).to.be.gt(wantBalStart.mul(99).div(100));
  }).timeout(TIMEOUT);

  it('It has the correct owners and keeper.', async () => {
    const vaultOwner = await vault.owner();
    const stratOwner = await strategy.owner();
    const stratKeeper = await strategy.keeper();

    expect(vaultOwner).to.equal(config.vaultOwner);
    expect(stratOwner).to.equal(config.strategyOwner);
    expect(stratKeeper).to.equal(config.keeper);
  }).timeout(TIMEOUT);

  it('Vault and strat references are correct', async () => {
    const stratReference = await vault.strategy();
    const vaultReference = await strategy.vault();

    expect(stratReference).to.equal(ethers.utils.getAddress(strategy.address));
    expect(vaultReference).to.equal(ethers.utils.getAddress(vault.address));
  }).timeout(TIMEOUT);

  it('Displays routing correctly', async () => {
    const { tokenAddressMap } = addressBook[chainName];

    // outputToLp0Route
    console.log('outputToLp0Route:');
    for (let i = 0; i < 10; ++i) {
      try {
        const tokenAddress = await strategy.outputToLp0Route(i);
        if (tokenAddress in tokenAddressMap) {
          console.log(tokenAddressMap[tokenAddress]);
        } else {
          console.log(tokenAddress);
        }
      } catch {
        // reached end
        if (i == 0) {
          console.log('No routing, output must be lp0');
        }
        break;
      }
    }

    // outputToLp1Route
    console.log('outputToLp1Route:');
    for (let i = 0; i < 10; ++i) {
      try {
        const tokenAddress = await strategy.outputToLp1Route(i);
        if (tokenAddress in tokenAddressMap) {
          console.log(tokenAddressMap[tokenAddress].symbol);
        } else {
          console.log(tokenAddress);
        }
      } catch {
        // reached end
        if (i == 0) {
          console.log('No routing, output must be lp1');
        }
        break;
      }
    }
  }).timeout(TIMEOUT);

  it('Has correct call fee', async () => {
    const callFee = await strategy.callFee();

    const expectedCallFee = 11;
    const actualCallFee = parseInt(callFee)

    expect(actualCallFee).to.equal(expectedCallFee);
  }).timeout(TIMEOUT);

  it('has withdraw fee of 0 if harvest on deposit is true', async () => {
    const harvestOnDeposit = await strategy.harvestOnDeposit();

    const withdrawalFee = await strategy.withdrawalFee();
    const actualWithdrawalFee = parseInt(withdrawalFee);
    if(harvestOnDeposit) {
      expect(actualWithdrawalFee).to.equal(0);
    } else {
      expect(actualWithdrawalFee).not.to.equal(0);
    }
  }).timeout(TIMEOUT);
});