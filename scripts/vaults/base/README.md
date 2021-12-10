# Deploying vaults

## Note
The contracts in the `/base` directory should be used as templates
Please copy and paste into new files for actual deployment

### Initial vault
1. Determine all the configuration addresses you are going to need (LP, farm, etc.)
2. Make a copy of the deployFarm_TOKEN1_TOKEN2.ts file
3. When you run the deploy script, it will deploy the vault and strategy
4. Copy the input params and final contract addresses to setup the frontend


### Deploying a new strategy
1. Make a copy of deployCandidate.ts
2. Deploy the strategy candidate, note the new address
3. Call `proposeStrat` on the vault contract
4. Call `upgradeStrat` on the vault contract 
