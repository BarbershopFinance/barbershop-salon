import hardhat from 'hardhat';
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
    name: 'Follicle ApeSwap DAI-USDC',
    symbol: 'follicleApeSwap_DAI-USDC',
    delay: 0,
    strategy: {
      contractName: 'StrategyApeSwapLP',
      want: '0x5b13b583d4317ab15186ed660a1e4c65c10da659', // ape pair usdc-dai
      poolId: 5,
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
        addressBook.polygon.tokens.USDC.address,
      ],
      outputToLp1Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
        addressBook.polygon.tokens.DAI.address,
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