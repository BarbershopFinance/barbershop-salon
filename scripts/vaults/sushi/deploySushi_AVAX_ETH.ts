import hardhat from 'hardhat';
import barbershopConfig from '../../../config/vaults/barbershop';
import sushiConfig from '../../../config/vaults/sushi/sushiConfig';
import deployVault, { VaultConfig } from '../../../utils/deploy/deploySushiVault';
import { addressBook } from 'blockchain-addressbook';

const config = {
  ...sushiConfig(),
  ...barbershopConfig(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VaultBarber',    
    name: 'Follicle SushiSwap AVAX-ETH',
    symbol: 'FollicleSushiswap_AVAX-ETH',
    delay: 0,
    strategy: {
      contractName: 'StrategySushiSwapLP',
      want: '0x1274de0de2e9d9b1d0e06313c0e5edd01cc335ef',
      poolId: 38,
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
        addressBook.polygon.tokens.AVAX.address,
      ],
      outputToLp1Route: [
        config.output,
        addressBook.polygon.tokens.ETH.address,
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