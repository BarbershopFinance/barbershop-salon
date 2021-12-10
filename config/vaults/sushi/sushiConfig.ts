import { addressBook } from "blockchain-addressbook";

const { tokens } = addressBook.polygon;

/*
* these vars are consistent for any sushi farm
*/
export const sushiConfig = () => {
  const chef = '0x0769fd68dfb93167989c6f7254cd0d766fb2841f'; // sushi mini chef v2
  const router = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506'; // sushi router
  const output = tokens.SUSHI.address;
  const native = tokens.WMATIC.address;
  const reward = tokens.WMATIC.address;


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
    nativeToOutputRoute,
    output,
    outputToNativeRoute,
    router,
    rewardToOutputRoute,
  };
};

export default sushiConfig;