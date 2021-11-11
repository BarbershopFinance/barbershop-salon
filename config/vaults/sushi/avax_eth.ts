import sushiConfig from './sushiConfig';
/*
* these vars are unique for this specific vault and strategy
*/
export const sushiVaultAvaxEth = () => {
  const lpToken0 = '0x2c89bbc92bd86f8075d1decc58c7f4e0107f286b'; // avax
  const lpToken1 = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'; // weth
  const output = sushiConfig().output; // sushi token

  const want = '0x1274de0de2e9d9b1d0e06313c0e5edd01cc335ef'; // sushi uniswapv2 pair
  const poolId = 38;

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
    poolId,
    want,
  };
};

export default sushiVaultAvaxEth;