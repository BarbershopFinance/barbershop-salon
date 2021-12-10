import hardhat from 'hardhat';
import sushiConfig from '../../../config/vaults/sushi/sushiConfig';
import deployVault, { VaultConfig } from '../../../utils/deploy/deploySushiVault';
import { addressBook } from 'blockchain-addressbook';
import barbershopConfig from '../../../config/vaults/barbershop';

const config = {
  ...sushiConfig(),
  ...barbershopConfig(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VaultBarber',
    name: 'Follicle ApeSwap AAVE-ETH',
    symbol: 'follicleApeSwap_AAVE-ETH',
    delay: 0,
    strategy: {
      contractName: 'StrategySushiSwapLP',
      want: '0x2813d43463c374a680f235c428fb1d7f08de0b69', // sushi pair aave-eth 
      poolId: 6,
      chef: config.chef,
      router: config.router,

      keeper: config.vaultKeeper,
      strategist: config.vaultStrategistOwner,
      barbershopFeeRecipient: config.vaultBarbershopFeeRecipient,

      outputToNativeRoute: config.outputToNativeRoute,
      rewardToOutputRoute: config.rewardToOutputRoute,
      outputToLp0Route: [
        config.output,
        addressBook.polygon.tokens.ETH.address,
      ],
      outputToLp1Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
        addressBook.polygon.tokens.AAVE.address,
      ],
    }
  };

  return deployVault(vault);
}

main()
  .then((resp) => {
    console.log('CONFIG (copy to frontend)');
    console.log('config: ', config);

    console.log('vault address: ', resp.vault);
    console.log('strategy address: ', resp.strategy);

    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });