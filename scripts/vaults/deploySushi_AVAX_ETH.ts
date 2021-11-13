import hardhat from 'hardhat';
import sushiVaultAvaxEth from '../../config/vaults/sushi/avax_eth';
import sushiConfig from '../../config/vaults/sushi/sushiConfig';
import deployVault, { VaultConfig } from '../../utils/deployVault';

const myAddress = '0x749Ed2e4A52B44eE6d7c111f47Ef3e4a8bafe4f5';

// could the beefy replacemant matter in predictAddresses??

const config = {
  ...sushiConfig(),
  ...sushiVaultAvaxEth(),
};

async function main() {
  await hardhat.run('compile');

  const vault: VaultConfig = {
    contractName: 'VB',    
    name: 'VB-avax_eth',
    symbol: 'vb-avax-eth',
    delay: 0,
    strategy: {
      contractName: 'StrategySushiSwapLP',
      want: config.want,
      poolId: config.poolId,
      chef: config.chef,

      // while testing
      router: myAddress,
      keeper: myAddress,
      strategist: myAddress,
      beefyFeeRecipient: myAddress,

      outputToNativeRoute: config.outputToNativeRoute,
      outputToLp0Route: config.outputToLp0Route,
      outputToLp1Route: config.outputToLp1Route,
    }
  };

  return deployVault(vault);
}

main()
  .then((resp) => {
    console.log('CONFIG (copy to frontend)');
    console.log('config: ', config);

    console.log('vault address: ', resp.vault.address);
    console.log('strategy address: ', resp.strategy.address);

    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });