const { Contract, utils } = require("ethers");
const { promisify } = require("util");
const fs = require("fs");
const { loadEnvironmentVariables } = require("./_helpers");

// Load environment variables
loadEnvironmentVariables();

WHYDRA_ADDRESS = process.env.WHYDRA_ADDRESS;
MY_TOKEN1_ADDRESS = process.env.MY_TOKEN1_ADDRESS;
MY_TOKEN2_ADDRESS = process.env.MY_TOKEN2_ADDRESS;
FACTORY_V2_ADDRESS = process.env.FACTORY_V2_ADDRESS;
ROUTER_V2_ADDRESS = process.env.ROUTER_V2_ADDRESS;

const artifacts = {
  MyToken: require("../artifacts/contracts/MyToken.sol/MyToken.json"),
  UniswapV2Factory: require("@uniswap/v2-core/build/UniswapV2Factory.json"),
  UniswapV2Router02: require("@uniswap/v2-periphery/build/UniswapV2Router02.json"),
  UniswapV2Pair: require("@uniswap/v2-periphery/build/IUniswapV2Pair.json"),
};

async function main() {
  const provider = ethers.provider;
  const [_owner] = await ethers.getSigners();

  // Mint Tokens and Approve
  const MT1Contract = new Contract(
    MY_TOKEN1_ADDRESS,
    artifacts.MyToken.abi,
    provider
  );
  const MT2Contract = new Contract(
    MY_TOKEN2_ADDRESS,
    artifacts.MyToken.abi,
    provider
  );

  await MT1Contract.connect(_owner).mint(
    _owner.address,
    ethers.utils.parseEther("1000")
  );
  await MT2Contract.connect(_owner).mint(
    _owner.address,
    ethers.utils.parseEther("1000")
  );
  await MT1Contract.connect(_owner).approve(
    ROUTER_V2_ADDRESS,
    ethers.utils.parseEther("1000")
  );
  await MT2Contract.connect(_owner).approve(
    ROUTER_V2_ADDRESS,
    ethers.utils.parseEther("1000")
  );

  // Get V2 Factory and Router
  const FactoryV2 = new Contract(
    FACTORY_V2_ADDRESS,
    artifacts.UniswapV2Factory.abi,
    provider
  );

  const RouterV2 = new Contract(
    ROUTER_V2_ADDRESS,
    artifacts.UniswapV2Router02.abi,
    provider
  );

  // Create Pair
  const tx1 = await FactoryV2.connect(_owner).createPair(
    MT1Contract.address,
    MT2Contract.address
  );
  await tx1.wait();
  const pairAddress = await FactoryV2.getPair(
    MT1Contract.address,
    MT2Contract.address
  );

  const pair = new Contract(pairAddress, artifacts.UniswapV2Pair.abi, _owner);
  let reserves;
  reserves = await pair.getReserves();
  console.log("Reserves Before", reserves);

  // Add Liquidity
  const token0Amount = utils.parseUnits("100");
  const token1Amount = utils.parseUnits("100");
  const deadline = Math.floor(Date.now() / 1000 + 10 * 60);
  const addLiquidityTx = await RouterV2.connect(_owner).addLiquidity(
    MT1Contract.address,
    MT2Contract.address,
    token0Amount,
    token1Amount,
    0,
    0,
    _owner.address,
    deadline,
    { gasLimit: utils.hexlify(1000000) }
  );

  addLiquidityTx.wait();
  reserves = await pair.getReserves();
  console.log("Reserves After", reserves);

  let addresses = [
    `PAIR_ADDRESS=${pairAddress}`,
    `PAIR_____________CREATED_____________V2`,
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
    npx hardhat run --network localhost scripts/3-createPair.js
    npx hardhat run --network hydraTest scripts/3-createPair.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
