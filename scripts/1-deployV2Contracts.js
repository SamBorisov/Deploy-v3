const { ContractFactory } = require("ethers");
const fs = require("fs");
const { promisify } = require("util");
const { loadEnvironmentVariables } = require("./_helpers");

// Load environment variables
loadEnvironmentVariables();

const WETH_ADDRESS = process.env.WETH_ADDRESS;

const artifacts = {
  UniswapV2Factory: require("@uniswap/v2-core/build/UniswapV2Factory.json"),
  UniswapV2Router02: require("@uniswap/v2-periphery/build/UniswapV2Router02.json"),
};

async function main() {
  const [signer] = await ethers.getSigners();
  const governance = process.env.GOVERNANCE_ADDRESS;
  console.log("Deploying with signer:", signer.address);
  console.log("Setting owner to governance:", governance);

  // V2 Factory
  const FactoryV2 = new ContractFactory(
    artifacts.UniswapV2Factory.abi,
    artifacts.UniswapV2Factory.bytecode,
    signer
  );
  const factoryV2 = await FactoryV2.deploy(governance);
  const feeSetter = await factoryV2.feeToSetter();

  console.log("V2 Factory deployed to:", factoryV2.address);
  console.log("Fee Setter set to:", feeSetter);

  // V2 Router
  const RouterV2 = new ContractFactory(
    artifacts.UniswapV2Router02.abi,
    artifacts.UniswapV2Router02.bytecode,
    signer
  );
  const routerV2 = await RouterV2.deploy(factoryV2.address, WETH_ADDRESS);

  console.log("V2 Router deployed to:", routerV2.address);

  // Write addresses to .env.local
  let addresses = [
    `FACTORY_V2_ADDRESS=${factoryV2.address}`,
    `ROUTER_V2_ADDRESS=${routerV2.address}`,
    `___________V2_CONTRACTS_SET___________`,
  ];

  const data = "\n" + addresses.join("\n");

  const writeFile = promisify(fs.appendFile);
  const filePath = ".env.local";
  return writeFile(filePath, data)
    .then(() => {
      console.log("Addresses recorded.");
    })
    .catch((error) => {
      console.error("Error logging addresses:", error);
      throw error;
    });
}

/*
    npx hardhat run --network localhost scripts/1-deployV2Contracts.js
    npx hardhat run --network hydraTest scripts/1-deployV2Contracts.js
    npx hardhat run --network devTest scripts/1-deployV2Contracts.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
