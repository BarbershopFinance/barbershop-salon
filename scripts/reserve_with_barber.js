const { writeJSONToFile } = require('./ape/helpers/files.ts');
const { Contract } = require('@ethersproject/contracts');

// Encode Timelock Transactions
// const Barber = require('../build/contracts/Barber.sol/Barber.json');
// const Timelock = require('../build/contracts/Timelock.sol/Timelock.json');

const { ethers } = require('hardhat');

// testnet
const DEFAULT_OFFSET = 65;
// mainnet
// const DEFAULT_OFFSET = 3600 * 6.5;
const getTimestamp = (offsetSeconds = 0) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp + offsetSeconds;
};

console.log('process.env...', process.env.LPTOKEN);

async function main () {
  // Testnet
  const BARBER_ADDRESS = process.env.BARBER_ADDRESS;
  const HAIR_ADDRESS = process.env.HAIR_ADDRESS;
  // const TIMELOCK_ADDRESS = process.env.TIMELOCK_ADDRESS;

  console.log('BARBER_ADDRESS', BARBER_ADDRESS);
  const Barber = await ethers.getContractFactory('Barber');
  const barber = await Barber.attach(BARBER_ADDRESS);

  const value = await barber.add(100, HAIR_ADDRESS, 0, false);
  // const pools = await barber.poolInfo();

  console.log('value: ', value);
}

// const encode = async () => {
//   /*
//      * General use Barber functions
//      */

//   /**
//      * Update the multiplier of HAIR minted per block
//      * updateMultiplier(uint256 multiplierNumber)
//      */
//   // const ETA = getTimestamp(DEFAULT_OFFSET);
//   // const method = 'updateMultiplier';
//   // const barberTXEncodeFunction = barberContract.populateTransaction[method];
//   // const barberArgsArray = [[1]];

//   /**
//      * Update a farm multiplier by the pid (pool id)
//      * set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)
//      */

//   //  BNB/DOGE LP (pid38 200-[100]) 0xfd1ef328A17A8e8Eeaf7e4Ea1ed8a108E1F2d096
//   //  BNB/LTC LP (pid39 200-[100]) 0x0F12362c017Fe5101c7bBa09390f1CB729f5B318

//   // // const ETA = getTimestamp(DEFAULT_OFFSET + (3600 * 24 * 2));
//   // const ETA = getTimestamp(DEFAULT_OFFSET);
//   // const method = 'set';
//   // const barberTXEncodeFunction = barberContract.populateTransaction[method];
//   // const barberArgsArray = [
//   //     [43, 0, false],
//   // ]

//   /**
//      * Add a new farm to Barber
//      * add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate)
//      */
//   const ETA = getTimestamp(DEFAULT_OFFSET);
//   const method = 'add';
//   const barberTXEncodeFunction = barberContract.populateTransaction[method];
//   const barberArgsArray = [
//     [
//       0, // _allocPoint
//       process.env.LPTOKEN, // _lpToken
//       0, // _depositFeeBP
//       false, // _withUpdate
//     ],
//   ];

//   const outputs = [];

//   for (const barberArgs of barberArgsArray) {
//     /**
//      * Encode child tx
//      */
//     const barberTXEncoded = await barberTXEncodeFunction(...barberArgs);

//     // queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta)
//     const timelockQueueEncoded = await timelockContract.populateTransaction
//       .queueTransaction(
//         BARBER_ADDRESS,
//         0,
//         '',
//         barberTXEncoded.data,
//         ETA,
//       );

//     // executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) public payable returns (bytes memory)
//     const timelockExecuteEncoded = await timelockContract.populateTransaction
//       .executeTransaction(
//         BARBER_ADDRESS,
//         0,
//         '',
//         barberTXEncoded.data,
//         ETA,
//       );

//     // cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta)
//     const timelockCancelEncoded = await timelockContract.populateTransaction
//       .cancelTransaction(
//         BARBER_ADDRESS,
//         0,
//         '',
//         barberTXEncoded.data,
//         ETA,
//       );

//     const output = {
//       'ETA-Timestamp': ETA,
//       Date: new Date(ETA * 1000),
//       queueTx: '',
//       executeTx: '',
//       cancelTx: '',
//       barberTXEncodeFunction: method,
//       barberArgs,
//       barberTXEncoded,
//       timelockQueueEncoded,
//       timelockExecuteEncoded,
//       timelockCancelEncoded,
//     };

//     outputs.push(output);
//   }

//   console.dir(outputs);
//   await writeJSONToFile('./scripts/encode-output.json', outputs);
// };

// encode().then(() => {
//   console.log('Done encoding!');
// });

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
