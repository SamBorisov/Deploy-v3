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
  const [owner] = await ethers.getSigners();

  // // If you wanna use local, replace this with _owner or another signer
  // const provider = ethers.provider;
  // const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // V2 Factory
  const FactoryV2 = new ContractFactory(
    artifacts.UniswapV2Factory.abi,
    artifacts.UniswapV2Factory.bytecode,
    owner
  );
  const factoryV2 = await FactoryV2.deploy(owner.address);

  console.log("V2 Factory deployed to:", factoryV2.address);

  // V2 Router
  const RouterV2 = new ContractFactory(
    artifacts.UniswapV2Router02.abi,
    artifacts.UniswapV2Router02.bytecode,
    owner
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
