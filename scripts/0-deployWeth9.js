require("dotenv").config();
const fs = require("fs");
const { promisify } = require("util");

async function main() {
  const [signer] = await ethers.getSigners();

  // WETH
  const Weth9 = await ethers.getContractFactory("WETH9_", signer);
  const weth = await Weth9.deploy();

  console.log("WETH deployed to:", weth.address);

  // Create 2 mock tokens and mint to signer (NO NEED ON PRODUCTION)
  const MyToken1 = await ethers.getContractFactory("MyToken", signer);
  const myToken1 = await MyToken1.deploy("MyToken1", "MT1");

  console.log("MyToken1 deployed to:", myToken1.address);

  const MyToken2 = await ethers.getContractFactory("MyToken", signer);
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
