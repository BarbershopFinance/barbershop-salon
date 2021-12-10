import hardhat from 'hardhat';
import quickVault from '../../../config/vaults/quickswap/aave_eth';
import quickConfig from '../../../config/vaults/quickswap/quickConfig';
import deployQuickswapVault, { VaultConfig } from '../../../utils/deploy/deployQuickswapVault';

const myAddress = '0x749Ed2e4A52B44eE6d7c111f47Ef3e4a8bafe4f5';

const config = {
  ...quickConfig(),
  ...quickVault(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VaultBarber',    
    name: 'VB-eth_aave',
    symbol: 'vb-eth_aave',
    delay: 0,
    strategy: {
      contractName: 'StrategyQuickSwapStakingRewards',
      want: config.want,
      chef: config.chef,

      // while testing
      router: config.router,
      keeper: myAddress,
      strategist: myAddress,
      barbershopFeeRecipient: myAddress,

      outputToNativeRoute: config.outputToNativeRoute,
      outputToLp0Route: config.outputToLp0Route,
      outputToLp1Route: config.outputToLp1Route,
    }
  };

  return deployQuickswapVault(vault);
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