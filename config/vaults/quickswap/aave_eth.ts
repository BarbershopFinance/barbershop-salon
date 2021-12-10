import quickConfig from './quickConfig';
/*
* these vars are unique for this specific vault and strategy
*/
export const quickVaultAaveEth = () => {
  const reward = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1'; // dQuick / DragonLair
  const chef = '0x9891548FB271C2350bd0FA25eb56A3b558cD4A64'; // stakingRewards.sol
  const lpToken0 = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'; // weth
  const lpToken1 = '0xd6df932a45c0f255f85145f286ea0b292b21c90b'; // aave
  const output = quickConfig().output; // sushi token

  const want = '0x90bc3e68ba8393a3bf2d79309365089975341a43'; // quick pair (UniswapV2Pair)

  const outputToLp0Route = [
    output,
    lpToken1,
    lpToken0
  ];

  const outputToLp1Route = [
    output,
    lpToken1
  ];

  return {
    lpToken0,
    lpToken1,
    outputToLp0Route,
    outputToLp1Route,
    want,
    chef,
  };
};

export default quickVaultAaveEth;