import hardhat from 'hardhat';
import sushiVaultAvaxEth from '../../../config/vaults/sushi/avax_eth';
import apeConfig from '../../../config/vaults/ape/apeConfig';
import deployVault, { VaultConfig } from '../../../utils/deploy/deploySushiVault';
import { addressBook } from 'blockchain-addressbook';
import barbershopConfig from '../../../config/vaults/barbershop';

const config = {
  ...apeConfig(),
  ...barbershopConfig(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VaultBarber',
    name: 'Follicle ApeSwap BTC-MATIC',
    symbol: 'follicleApeSwap_BTC-MATIC',
    delay: 0,
    strategy: {
      contractName: 'StrategyApeSwapLP',
      want: '0xe82635a105c520fd58e597181cBf754961d51E3e', // ape pair btc-matic
      poolId: 4,
      chef: config.chef,
      router: config.router,

      keeper: config.vaultKeeper,
      strategist: config.vaultStrategistOwner,
      barbershopFeeRecipient: config.vaultBarbershopFeeRecipient,

      outputToNativeRoute: config.outputToNativeRoute,
      rewardToOutputRoute: config.rewardToOutputRoute,
      outputToLp0Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
      ],
      outputToLp1Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
        addressBook.polygon.tokens.WBTC.address,
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