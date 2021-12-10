import { addressBook } from "blockchain-addressbook";

const { tokens } = addressBook.polygon;

/*
* these vars are consistent for aave lending/borrowing strategy
*/
export const aaveConfig = () => {
  const chef = '0x0769fd68dfb93167989c6f7254cd0d766fb2841f'; // sushi mini chef v2
  const dataProvider = '0x7551b5d2763519d4e37e8b81929d336de671d46d'; // aave protocol data provider
  const incentivesController = '0x357d51124f59836ded84c8a1730d72b749d8bc23'; // aave incentives controller
  const lendingPool = '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf'; // aave lending pool
  const router = '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff'; // quickswap router
  const want = tokens.ETH.address;
  const native = tokens.WMATIC.address;



  return {
    chef,
    dataProvider,
    incentivesController,
    lendingPool,
    native,
    router,
    want
  };
};

export default aaveConfig;