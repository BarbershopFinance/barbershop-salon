/*
* these vars are consistent for any quick farm
*/
export const quickConfig = () => {
  const output = '0x831753dd7087cac61ab5644b308642cc1c33dc13'; // quick token
  const router = '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff'; // quick router
  const native = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; // matic
  // const reward = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1'; // dQuick

  const nativeToOutputRoute = [
    native,
    output
  ];

  const outputToNativeRoute = [
    output,
    native
  ];

  return {
    native,
    nativeToOutputRoute,
    output,
    outputToNativeRoute,
    router,
  };
};

export default quickConfig;