# Barbershop.Finance

Hair Farming 🦱

### Setup
This project uses
- [hardhat](https://hardhat.org/)
- [ethers](https://docs.ethers.io/v5/)

## Compiling
- `npx hardhat compile`

## Tests
- `npx hardhat test`

Want to run just one test?
`it.only('myTest...', () => {})`

Note: All tests assume a `BONUS_MULTIPLIER` of 1. When we actually deploy the contract, we will likely bump this and slowly decrease for the first week.


## Deployments

You can deploy the initial smart contracts following these steps:

### Local

1. Start a local node

`npx hardhat node`

2. Open a new terminal and deploy the smart contracts in the localhost network

`npx hardhat run --network localhost scripts/deploy_initial.js`

### Testnet

1. Deploy the smart contracts in the testnet network configured in hardhat.config

`npx hardhat run --network maticTestnet scripts/deploy_initial.js`


__ extra __

3. As general rule, you can target any network configured in the hardhat.config.js

`npx hardhat run --network <your-network> scripts/deploy.js`


### Flatten a contract
`npx hardhat flatten contracts/MasterChef.sol | pbcopy`

- You'll need to remove all but the first NPX-LICENSE line or you get an error reminding you to do so when you upload it
- There is a Remix flatten plugin but I couldn't get the output to work with Polygonscan


## Verifying tokens

[solidity flattener](https://github.com/poanetwork/solidity-flattener) is good for turning openzeppelin `@import` to multipart-file

With it we can do something like this:

`./node_modules/.bin/poa-solidity-flattener ./contracts/HairToken.sol`

It spits out a flat contract which we can upload to Polygonscan to the `/out` folder.
