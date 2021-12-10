import hardhat from 'hardhat';
import maiConfig from '../../../config/vaults/mai/maiConfig';
import deployMaiVault from '../../../utils/deploy/deployMaiVault';
import { addressBook } from 'blockchain-addressbook';
import barbershopConfig from '../../../config/vaults/barbershop';
import { VaultConfig } from '../../../utils/deploy/deploySushiVault';

const config = {
  ...maiConfig(),
  ...barbershopConfig(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VaultBarber',
    name: 'Follicle Quickswap MAI-USDC',
    symbol: 'follicleQuickswap_MAI_USDC',
    delay: 0,
    strategy: {
      contractName: 'StrategyMaiLP',
      want: '0x160532D2536175d65C03B97b0630A9802c274daD', // mai mai-usdc (miMatic)
      poolId: 1,
      chef: config.chef,
      router: config.router,

      keeper: config.vaultKeeper,
      strategist: config.vaultStrategistOwner,
      barbershopFeeRecipient: config.vaultBarbershopFeeRecipient,

      outputToNativeRoute: config.outputToNativeRoute,
      outputToLp0Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
        addressBook.polygon.tokens.USDC.address,
      ],
      outputToLp1Route: [
        config.output,
        addressBook.polygon.tokens.WMATIC.address,
        addressBook.polygon.tokens.MAI.address,
      ],
    }
  };

  return deployMaiVault(vault);
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