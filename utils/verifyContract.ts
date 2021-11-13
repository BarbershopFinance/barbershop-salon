import { Address } from 'hardhat-deploy/dist/types';
import hardhat from "hardhat";

export const verifyContract = async (
  address: Address,
  constructorArguments: any[],
) => {
  await hardhat.run("verify:verify", {
    address,
    constructorArguments,
  });
};