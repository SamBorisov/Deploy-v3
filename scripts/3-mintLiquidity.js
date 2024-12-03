const { Contract } = require("ethers");
const { Token } = require("@uniswap/sdk-core");
const { Pool, Position, nearestUsableTick } = require("@uniswap/v3-sdk");

const { loadEnvironmentVariables } = require("./_helpers");

// Load environment variables
loadEnvironmentVariables();

MY_TOKEN1_ADDRESS = process.env.MY_TOKEN1_ADDRESS;
MY_TOKEN2_ADDRESS = process.env.MY_TOKEN2_ADDRESS;
WETH_ADDRESS = process.env.WETH_ADDRESS;
FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
SWAP_ROUTER_ADDRESS = process.env.SWAP_ROUTER_ADDRESS;
NFT_DESCRIPTOR_ADDRESS = process.env.NFT_DESCRIPTOR_ADDRESS;
POSITION_DESCRIPTOR_ADDRESS = process.env.POSITION_DESCRIPTOR_ADDRESS;
POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS;
TOKEN_POOL = process.env.TOKEN_POOL;

const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  MyToken: require("../artifacts/contracts/MyToken.sol/MyToken.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
}

async function main() {
  const provider = ethers.provider;
  const [_owner] = await ethers.getSigners();

  // // If you wanna use local, replace this with _owner or another signer
  // const _owner = new ethers.Wallet(
  //   process.env.process.env.PRIVATE_KEY,
  //   provider
  // );

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
    POSITION_MANAGER_ADDRESS,
    ethers.utils.parseEther("1000")
  );
  await MT2Contract.connect(_owner).approve(
    POSITION_MANAGER_ADDRESS,
    ethers.utils.parseEther("1000")
  );

  const poolContract = new Contract(
    TOKEN_POOL,
    artifacts.UniswapV3Pool.abi,
    provider
  );

  const poolData = await getPoolData(poolContract);

  const MyToken1 = new Token(31337, MY_TOKEN1_ADDRESS, 18, "MT1", "MyToken1");
  const MyToken2 = new Token(31337, MY_TOKEN2_ADDRESS, 18, "MT2", "MyToken2");

  const pool = new Pool(
    MyToken1,
    MyToken2,
    poolData.fee,
    poolData.sqrtPriceX96.toString(),
    poolData.liquidity.toString(),
    poolData.tick
  );

  const position = new Position({
    pool: pool,
    liquidity: ethers.utils.parseEther("1"),
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
  });

  const { amount0: amount0Desired, amount1: amount1Desired } =
    position.mintAmounts;

  params = {
    token0: MY_TOKEN1_ADDRESS,
    token1: MY_TOKEN2_ADDRESS,
    fee: poolData.fee,
    tickLower:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) -
      poolData.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolData.tick, poolData.tickSpacing) +
      poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: _owner.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  };

  const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    provider
  );

  const tx = await nonfungiblePositionManager
    .connect(_owner)
    .mint(params, { gasLimit: "1000000" });
  await tx.wait();

  // Check the pool data after minting
  const poolDataAfterMint = await getPoolData(poolContract);
  console.log("poolData", poolDataAfterMint);
}

/*
    npx hardhat run --network localhost scripts/3-mintLiquidity.js
    npx hardhat run --network hydraTest scripts/3-mintLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
