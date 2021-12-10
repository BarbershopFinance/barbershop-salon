import { addressBook } from 'blockchain-addressbook';

const { tokens } = addressBook.polygon;

/*
* these vars are consistent for any ape farm
*/
export const apeConfig = () => {
  const chef = '0x54aff400858dcac39797a81894d9920f16972d1d'; // miniApeV2
  const router = '0xc0788a3ad43d79aa53b09c2eacc313a787d1d607'; // ape router
  const output = tokens.BANANA.address; // banana
  const native = tokens.WMATIC.address; // matic
  const reward = tokens.WMATIC.address; // matic

  const nativeToOutputRoute = [
    native,
    output
  ];

  const outputToNativeRoute = [
    output,
    native
  ];

  const rewardToOutputRoute = [
    reward,
    output 
  ];

  return {
    chef,
    native,
    output,
    router,
    nativeToOutputRoute,
    outputToNativeRoute,
    rewardToOutputRoute,
  };
};

export default apeConfig;