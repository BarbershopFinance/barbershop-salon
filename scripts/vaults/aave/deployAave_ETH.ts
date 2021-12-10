import hardhat from 'hardhat';
import aaveConfig from '../../../config/vaults/aave/aaveConfig';
import deployAaveVault, { AaveVaultConfig } from '../../../utils/deploy/deployAaveVault';
import { addressBook } from 'blockchain-addressbook';
import barbershopConfig from '../../../config/vaults/barbershop';

const config = {
  ...aaveConfig(),
  ...barbershopConfig(),
};

async function main() {
  await hardhat.run('compile');

  const vault: AaveVaultConfig = {
    contractName: 'VB',
    name: 'Aave ETH',
    symbol: 'aETH',
    delay: 0,
    strategy: {
      contractName: 'StrategyAave',
      want: addressBook.polygon.tokens.ETH.address,
      router: config.router,
      native: config.native,

      dataProvider: config.dataProvider,
      lendingPool: config.lendingPool,
      incentivesController: config.incentivesController,

      keeper: config.vaultKeeper,
      strategist: config.vaultStrategistOwner,
      barbershopFeeRecipient: config.vaultBarbershopFeeRecipient,
    }
  };

  return deployAaveVault(vault);
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