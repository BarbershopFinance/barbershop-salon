localhost:
	npx hardhat run --network localhost scripts/deploy_initial.js

testnet:
	npx hardhat run --network maticTestnet scripts/deploy_initial.js

mainnet:
	npx hardhat run --network maticMainnet scripts/deploy_initial.js

infura:
	npx hardhat run --network infura scripts/deploy_initial.js

farms_notinuse:
	npx hardhat run --network maticTestnet scripts/deploy_farms.js
	
read:
	npx hardhat run --network infura scripts/read.js

farms:
	LPTOKEN=xx__PUT_YOUR_TOKEN_HERE__xx npx hardhat run --network maticTestnet scripts/deploy_farms.js

reserve:
	npx hardhat run --network infura scripts/reserve_with_barber.js

update_emissions:
	npx hardhat run --network infura scripts/updateEmissionsRate.js

deploy_new_vault_local:
	npx hardhat run --network localhost scripts/vaults/deploySushi_AVAX_ETH.ts --verbose

deploy_new_vault:
	npx hardhat run --network maticMainnet scripts/vaults/deploySushi_AVAX_ETH.ts --verbose