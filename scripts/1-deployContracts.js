const { ContractFactory, utils } = require("ethers");
const fs = require("fs");
const { promisify } = require("util");
const { loadEnvironmentVariables } = require("./_helpers");

// Load environment variables
loadEnvironmentVariables();

const WETH_ADDRESS = process.env.WETH_ADDRESS;
const NFT_DESCRIPTOR_ADDRESS = process.env.NFT_DESCRIPTOR_ADDRESS;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  UniswapV3Migrator: require("@uniswap/v3-periphery/artifacts/contracts/V3Migrator.sol/V3Migrator.json"),
  QuoterV2: require("@uniswap/swap-router-contracts/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json"),
};

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = utils
        .getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        const start2 = 2 + start * 2;
        const length2 = length * 2;
        bytecode = bytecode
          .slice(0, start2)
          .concat(address)
          .concat(bytecode.slice(start2 + length2, bytecode.length));
      });
    });
  });
  return bytecode;
};

async function main() {
  const [owner] = await ethers.getSigners();

  // // If you wanna use local, replace this with _owner or another signer
  // const provider = ethers.provider;
  // const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // V3 Factory
  const Factory = new ContractFactory(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    owner
  );
  const factory = await Factory.deploy();

  // Swap Router
  const SwapRouter = new ContractFactory(
    artifacts.SwapRouter.abi,
    artifacts.SwapRouter.bytecode,
    owner
  );
  const swapRouter = await SwapRouter.deploy(factory.address, WETH_ADDRESS);

  // NFT Descriptor Library Linking
  const linkedBytecode = linkLibraries(
    {
      bytecode: artifacts.NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: {
        "NFTDescriptor.sol": {
          NFTDescriptor: [
            {
              length: 20,
              start: 1681,
            },
          ],
        },
      },
    },
    {
      NFTDescriptor: NFT_DESCRIPTOR_ADDRESS,
    }
  );

  // NFT Descriptor
  const nativeCurrencyLabelBytes = utils.formatBytes32String("WETH");
  const NonfungibleTokenPositionDescriptor = new ContractFactory(
    artifacts.NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    owner
  );
  const nonfungibleTokenPositionDescriptor =
    await NonfungibleTokenPositionDescriptor.deploy(
      WETH_ADDRESS,
      nativeCurrencyLabelBytes
    );

  // Nonfungible Position Manager
  const NonfungiblePositionManager = new ContractFactory(
    artifacts.NonfungiblePositionManager.abi,
    artifacts.NonfungiblePositionManager.bytecode,
    owner
  );
  const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
    factory.address,
    WETH_ADDRESS,
    nonfungibleTokenPositionDescriptor.address
  );

  // V3 Migrator
  const V3Migrator = new ContractFactory(
    artifacts.UniswapV3Migrator.abi,
    artifacts.UniswapV3Migrator.bytecode,
    owner
  );
  const v3Migrator = await V3Migrator.deploy(
    factory.address,
    WETH_ADDRESS,
    nonfungiblePositionManager.address
  );

  // Quoter V2 (for V3 contracts but second version of Quoter)
  const QuoterV2 = new ContractFactory(
    artifacts.QuoterV2.abi,
    artifacts.QuoterV2.bytecode,
    owner
  );
  const quoterV2 = await QuoterV2.deploy(factory.address, WETH_ADDRESS);

  // Write addresses to .env.local
  let addresses = [
    `FACTORY_ADDRESS=${factory.address}`,
    `SWAP_ROUTER_ADDRESS=${swapRouter.address}`,
    `POSITION_DESCRIPTOR_ADDRESS=${nonfungibleTokenPositionDescriptor.address}`,
    `POSITION_MANAGER_ADDRESS=${nonfungiblePositionManager.address}`,
    `V3_MIGRATOR_ADDRESS=${v3Migrator.address}`,
    `QUOTER_V2_ADDRESS=${quoterV2.address}`,
    `SECOND_______DEPLOYMENT_______FINISHED`,
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
    npx hardhat run --network localhost scripts/1-deployContracts.js
    npx hardhat run --network hydraTest scripts/1-deployContracts.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
