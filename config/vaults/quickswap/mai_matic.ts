import quickConfig from './quickConfig';
/*
* these vars are unique for this specific vault and strategy
*/
export const quickVaultMaiMatic = () => {
  const chef = ''; // stakingRewards.sol
  const lpToken0 = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; // matic
  const lpToken1 = '0xa3fa99a148fa48d14ed51d610c367c61876997f1'; // miMatic / mai / qi
  const output = quickConfig().output; // sushi token

  const want = '0x7805b64e2d99412d3b8f10dfe8fc55217c5cc954'; // quick pair

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

export default quickVaultMaiMatic;