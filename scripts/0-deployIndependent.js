require("dotenv").config();
const { ContractFactory, utils } = require("ethers");
const WETH9 = require("../abis/WETH9.json");
const fs = require("fs");
const { promisify } = require("util");

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  UniswapInterfaceMulticall: require("@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json"),
  TickLens: require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json"),
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

  console.log("WETH deployed to:", weth.address);

  // V3 Factory
  const Factory = new ContractFactory(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    owner
  );
  const factory = await Factory.deploy();

  console.log("V3 Factory deployed to:", factory.address);

  // Add 0.01% fee to factory
  const ONE_BP_FEE = 100;
  const ONE_BP_TICK_SPACING = 1;
  const tx = await factory
    .connect(owner)
    .enableFeeAmount(ONE_BP_FEE, ONE_BP_TICK_SPACING);
  await tx.wait();

  console.log("Fee 0.01% added to factory.");

  // NFT Descriptor Library
  const NFTDescriptor = new ContractFactory(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    owner
  );
  const nftDescriptor = await NFTDescriptor.deploy();

  console.log("NFT Descriptor deployed to:", nftDescriptor.address);

  // Multicall Interface
  const UniswapInterfaceMulticall = new ContractFactory(
    artifacts.UniswapInterfaceMulticall.abi,
    artifacts.UniswapInterfaceMulticall.bytecode,
    owner
  );
  const uniswapInterfaceMulticall = await UniswapInterfaceMulticall.deploy();

  console.log(
    "Multicall Interface deployed to:",
    uniswapInterfaceMulticall.address
  );

  // TickLens
  const TickLens = new ContractFactory(
    artifacts.TickLens.abi,
    artifacts.TickLens.bytecode,
    owner
  );
  const tickLens = await TickLens.deploy();

  console.log("TickLens deployed to:", tickLens.address);

  // Create 2 mock tokens and mint to owner (if needed)
  const amountToMint = ethers.utils.parseEther("1000000000");

  const MyToken1 = await ethers.getContractFactory("MyToken", owner);
  const myToken1 = await MyToken1.deploy("MyToken1", "MT1");
  await myToken1.mint(owner.address, amountToMint);

  console.log("MyToken1 deployed to:", myToken1.address);

  const MyToken2 = await ethers.getContractFactory("MyToken", owner);
  const myToken2 = await MyToken2.deploy("MyToken2", "MT2");
  await myToken2.mint(owner.address, amountToMint);

  console.log("MyToken2 deployed to:", myToken2.address);

  // Write addresses to .env.local
  let addresses = [
    `WETH_ADDRESS=${weth.address}`,
    `FACTORY_ADDRESS=${factory.address}`,
    `NFT_DESCRIPTOR_ADDRESS=${nftDescriptor.address}`,
    `MULTICALL_ADDRESS=${uniswapInterfaceMulticall.address}`,
    `TICK_LENS_ADDRESS=${tickLens.address}`,
    `MY_TOKEN1_ADDRESS=${myToken1.address}`,
    `MY_TOKEN2_ADDRESS=${myToken2.address}`,
    `___________DEPLOYED_ADDRESSES_FIRST___________`,
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
