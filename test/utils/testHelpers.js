const { ethers } = require('hardhat');

// TODO: Handle custom LPs (Like Belt LPs)

export const zapNativeToToken = async ({ amount, want, nativeTokenAddr, unirouter, recipient }) => {
  let isLpToken, lpPair, token0, token1, token0Bal, token1Bal;

  console.log('ZAPPING');
  try {
    lpPair = await ethers.getContractAt(
      'contracts/vaults/interfaces/common/IUniswapV2Pair.sol:IUniswapV2Pair',
      want,
    );

    const token0Addr = await lpPair.token0();

    console.log('tokenOAddr: ', token0Addr);
    token0 = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', token0Addr);

    const token1Addr = await lpPair.token1();
    console.log('token1Addr: ', token1Addr);
    token1 = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', token1Addr);

    isLpToken = true;
  } catch (e) {
    console.log('could not find lp token: ', e);
    isLpToken = false;
  }

  if (isLpToken) {
    console.log('trying to swap');
    try {
      token0Bal = await token0.balanceOf(recipient);
      token1Bal = await token1.balanceOf(recipient);

      console.log('token0Bal before: ', token0Bal.toString());
      console.log('token1Bal before: ', token1Bal.toString());

      await swapNativeForToken({
        unirouter,
        token: token0,
        recipient,
        nativeTokenAddr,
        amount: amount.div(2),
      });
      await swapNativeForToken({
        unirouter,
        token: token1,
        recipient,
        nativeTokenAddr,
        amount: amount.div(2),
      });

      token0Bal = await token0.balanceOf(recipient);
      token1Bal = await token1.balanceOf(recipient);

      console.log('token0Bal after: ', token0Bal.toString());
      console.log('token1Bal after: ', token1Bal.toString());
    } catch (e) {
      console.log('Could not swap succdessfully. Error:', e);
      return Promise.reject(e);
    }

    try {
      console.log('approving...');
      const approve1 = await token1.approve(unirouter.address, token1Bal);
      await approve1.wait();

      const approve2 = await token0.approve(unirouter.address, token0Bal);
      await approve2.wait();

      console.log('adding liquidity...');
      // eslint-disable-next-line max-len
      return await unirouter.addLiquidity(token0.address, token1.address, token0Bal, token1Bal, 1, 1, recipient, 5000000000);
    } catch (e) {
      console.log('Could not add LP liquidity.', e);
      return Promise.reject(e);
    }
  } else {
    try {
      console.log('in the trying else swapNativeForToken');
      await swapNativeForToken({ unirouter, token: want, recipient, nativeTokenAddr, amount });
    } catch (e) {
      console.log('Could not swap for want.', e);
    }
  }
};

export const swapNativeForToken = async ({ unirouter, token, nativeTokenAddr, amount, recipient }) => {
  if (token.address === nativeTokenAddr) {
    console.log('wrapping native', token);
    await wrapNative(amount, nativeTokenAddr);
    return;
  }

  try {
    const res = await unirouter.swapExactETHForTokens(0, [nativeTokenAddr, token.address], recipient, 5000000000, {
      value: amount,
    });
    return await res.wait();
  } catch (e) {
    console.log(`Could not swap for ${token.address}: ${e}`);
  }
};

export const logTokenBalance = async (token, wallet) => {
  const balance = await token.balanceOf(wallet);
  console.log(`Balance: ${ethers.utils.formatEther(balance.toString())}`);
};

export const getVaultWant = async (vault, wnative) => {
  let wantAddr;

  try {
    wantAddr = await vault.token();
  } catch (e) {
    try {
      wantAddr = await vault.want();
    } catch (e) {
      wantAddr = wnative;
    }
  }

  const want = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20', wantAddr);

  return want;
};

export const unpauseIfPaused = async (strat, keeper) => {
  const isPaused = await strat.paused();
  if (isPaused) {
    await strat.connect(keeper).unpause();
  }
};

export const wrapNative = async (amount, wNativeAddr) => {
  const wNative = await ethers.getContractAt('IWrappedNative', wNativeAddr);
  await wNative.deposit({ value: amount });
};
