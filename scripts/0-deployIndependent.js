require("dotenv").config();
const { ContractFactory, utils } = require("ethers");
const WETH9 = require("../abis/WETH9.json");
const fs = require("fs");
const { promisify } = require("util");

const artifacts = {
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  UniswapInterfaceMulticall: require("@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json"),
  TickLens: require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json"),
  UniswapV2Factory: require("@uniswap/v2-core/build/UniswapV2Factory.json"),
  UniswapV2Router02: require("@uniswap/v2-periphery/build/UniswapV2Router02.json"),
  WETH9,
};

async function main() {
  const [owner] = await ethers.getSigners();

  // // If you wanna use local, replace this with _owner or another signer
  // const provider = ethers.provider;
  // const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // WETH
  const Weth = new ContractFactory(WETH9.abi, WETH9.bytecode, owner);
  const weth = await Weth.deploy();

  // NFT Descriptor Library
  const NFTDescriptor = new ContractFactory(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    owner
  );
  const nftDescriptor = await NFTDescriptor.deploy();

  // Multicall Interface
  const UniswapInterfaceMulticall = new ContractFactory(
    artifacts.UniswapInterfaceMulticall.abi,
    artifacts.UniswapInterfaceMulticall.bytecode,
    owner
  );
  const uniswapInterfaceMulticall = await UniswapInterfaceMulticall.deploy();

  // TickLens
  const TickLens = new ContractFactory(
    artifacts.TickLens.abi,
    artifacts.TickLens.bytecode,
    owner
  );
  const tickLens = await TickLens.deploy();

  // V2 Factory
  const FactoryV2 = new ContractFactory(
    artifacts.UniswapV2Factory.abi,
    artifacts.UniswapV2Factory.bytecode,
    owner
  );
  const factoryV2 = await FactoryV2.deploy(owner.address);

  // V2 Router
  const RouterV2 = new ContractFactory(
    artifacts.UniswapV2Router02.abi,
    artifacts.UniswapV2Router02.bytecode,
    owner
  );
  const routerV2 = await RouterV2.deploy(factoryV2.address, weth.address);

  // Create 2 mock tokens and mint to owner (if needed)
  const amountToMint = ethers.utils.parseEther("1000000000");

  const MyToken1 = await ethers.getContractFactory("MyToken", owner);
  const myToken1 = await MyToken1.deploy("MyToken1", "MT1");
  await myToken1.mint(owner.address, amountToMint);

  const MyToken2 = await ethers.getContractFactory("MyToken", owner);
  const myToken2 = await MyToken2.deploy("MyToken2", "MT2");
  await myToken2.mint(owner.address, amountToMint);

  // Write addresses to .env.local
  let addresses = [
    `WETH_ADDRESS=${weth.address}`,
    `NFT_DESCRIPTOR_ADDRESS=${nftDescriptor.address}`,
    `MULTICALL_ADDRESS=${uniswapInterfaceMulticall.address}`,
    `TICK_LENS_ADDRESS=${tickLens.address}`,
    `FACTORY_V2_ADDRESS=${factoryV2.address}`,
    `ROUTER_V2_ADDRESS=${routerV2.address}`,
    `MY_TOKEN1_ADDRESS=${myToken1.address}`,
    `MY_TOKEN2_ADDRESS=${myToken2.address}`,
    `FIRST_______DEPLOYMENT_______FINISHED`,
  ];
  const data = addresses.join("\n");

  const writeFile = promisify(fs.writeFile);
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
    npx hardhat run --network localhost scripts/0-deployIndependent.js
    npx hardhat run --network hydraTest scripts/0-deployIndependent.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
