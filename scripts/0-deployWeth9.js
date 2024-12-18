require("dotenv").config();
const fs = require("fs");
const { promisify } = require("util");

async function main() {
  const [owner] = await ethers.getSigners();

  // // If you wanna use local, replace this with _owner or another signer
  // const provider = ethers.provider;
  // const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // WETH
  const Weth9 = await ethers.getContractFactory("WETH9_", owner);
  const weth = await Weth9.deploy();

  console.log("WETH deployed to:", weth.address);

  // Create 2 mock tokens and mint to owner (NO NEED ON PRODUCTION)
  const MyToken1 = await ethers.getContractFactory("MyToken", owner);
  const myToken1 = await MyToken1.deploy("MyToken1", "MT1");

  console.log("MyToken1 deployed to:", myToken1.address);

  const MyToken2 = await ethers.getContractFactory("MyToken", owner);
  const myToken2 = await MyToken2.deploy("MyToken2", "MT2");

  console.log("MyToken2 deployed to:", myToken2.address);

  // Write addresses to .env.local
  let addresses = [
    `WETH_ADDRESS=${weth.address}`,
    `MY_TOKEN1_ADDRESS=${myToken1.address}`,
    `MY_TOKEN2_ADDRESS=${myToken2.address}`,
    `___________ERC20_TOKENS_DEPLOYED___________`,
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
    npx hardhat run --network localhost scripts/0-deployWeth9.js
    npx hardhat run --network hydraTest scripts/0-deployWeth9.js
    npx hardhat run --network devTest scripts/0-deployWeth9.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
