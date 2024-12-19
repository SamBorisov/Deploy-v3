require("dotenv").config();
const { ContractFactory } = require("ethers");
const fs = require("fs");
const { promisify } = require("util");

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  UniswapInterfaceMulticall: require("@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json"),
  TickLens: require("@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json"),
};

async function main() {
  const [signer] = await ethers.getSigners();
  const governance = process.env.GOVERNANCE_ADDRESS;
  console.log("Deploying with signer:", signer.address);
  console.log("Setting owner to governance:", governance);

  // V3 Factory
  const Factory = new ContractFactory(
    artifacts.UniswapV3Factory.abi,
    artifacts.UniswapV3Factory.bytecode,
    signer
  );
  const factory = await Factory.deploy();

  console.log("V3 Factory deployed to:", factory.address);

  // Add 0.01% fee to factory
  const ONE_BP_FEE = 100;
  const ONE_BP_TICK_SPACING = 1;
  const tx = await factory
    .connect(signer)
    .enableFeeAmount(ONE_BP_FEE, ONE_BP_TICK_SPACING);
  await tx.wait();

  console.log("Fee 0.01% added to factory.");

  // Set owner to governance
  const txSetOwner = await factory.connect(signer).setOwner(governance);
  await txSetOwner.wait();
  const currentOwner = await factory.owner();

  console.log("Owner set to:", currentOwner);

  // NFT Descriptor Library
  const NFTDescriptor = new ContractFactory(
    artifacts.NFTDescriptor.abi,
    artifacts.NFTDescriptor.bytecode,
    signer
  );
  const nftDescriptor = await NFTDescriptor.deploy();

  console.log("NFT Descriptor deployed to:", nftDescriptor.address);

  // Multicall Interface
  const UniswapInterfaceMulticall = new ContractFactory(
    artifacts.UniswapInterfaceMulticall.abi,
    artifacts.UniswapInterfaceMulticall.bytecode,
    signer
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
    signer
  );
  const tickLens = await TickLens.deploy();

  console.log("TickLens deployed to:", tickLens.address);

  // Write addresses to .env.local
  let addresses = [
    `FACTORY_ADDRESS=${factory.address}`,
    `NFT_DESCRIPTOR_ADDRESS=${nftDescriptor.address}`,
    `MULTICALL_ADDRESS=${uniswapInterfaceMulticall.address}`,
    `TICK_LENS_ADDRESS=${tickLens.address}`,
    `___________V3_FACTORY_SET____________`,
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
    npx hardhat run --network localhost scripts/2-deployIndependent.js
    npx hardhat run --network hydraTest scripts/2-deployIndependent.js
    npx hardhat run --network devTest scripts/2-deployIndependent.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
