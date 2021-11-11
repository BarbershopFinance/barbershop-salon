/*
* these vars are consistent for any sushi farm
*/
export const sushiConfig = () => {
  const chef = '0x0769fd68dfb93167989c6f7254cd0d766fb2841f'; // sushi miniChefV2
  const output = '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a'; // sushi token (on polygon)
  const router = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506'; // sushi router
  const native = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';

  const nativeToOutputRoute = [
    native,
    output
  ];

  const outputToNativeRoute = [
    output,
    native
  ];

  return {
    chef,
    native,
    nativeToOutputRoute,
    output,
    outputToNativeRoute,
    router,
  };
};

export default sushiConfig;