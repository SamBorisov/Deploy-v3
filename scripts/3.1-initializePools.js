const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
const { promisify } = require("util");
const fs = require("fs");
const { loadEnvironmentVariables } = require("./_helpers");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

// Load environment variables
loadEnvironmentVariables();

MY_TOKEN1_ADDRESS = process.env.MY_TOKEN1_ADDRESS;
MY_TOKEN2_ADDRESS = process.env.MY_TOKEN2_ADDRESS;
FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

async function deployPool(token0, token1, fee, price) {
  const [owner] = await ethers.getSigners();

  const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    owner
  );

  const factory = new Contract(
    FACTORY_ADDRESS,
    artifacts.UniswapV3Factory.abi,
    owner
  );

  await nonfungiblePositionManager
    .connect(owner)
    .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
      gasLimit: 5000000,
    });

  const poolAddress = await factory.connect(owner).getPool(token0, token1, fee);
  return poolAddress;
}

async function main() {
  const tokenPool = await deployPool(
    MY_TOKEN1_ADDRESS,
    MY_TOKEN2_ADDRESS,
    100,
    encodePriceSqrt(1, 1)
  );

  let addresses = [
    `TOKEN_POOL=${tokenPool}`,
    `POOL____________CREATED_____________V3`,
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
    npx hardhat run --network localhost scripts/3.1-initializePools.js
    npx hardhat run --network hydraTest scripts/3.1-initializePools.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
