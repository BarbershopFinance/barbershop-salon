import { addressBook } from 'blockchain-addressbook';

const { tokens } = addressBook.polygon;

/*
* these vars are consistent for any quick mai farm
*/
export const maiConfig = () => {
  const chef = '0x574fe4e8120c4da1741b5fd45584de7a5b521f0f'; // mai Farm
  const router = '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff'; // quick router
  const output = tokens.QI.address;
  const native = tokens.WMATIC.address;

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
    output,
    router,
    nativeToOutputRoute,
    outputToNativeRoute,
  };
};

export default maiConfig;;