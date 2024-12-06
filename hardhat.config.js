require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { // V3
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: { yul: false },
      },
    },
  },
  // solidity: { // V2
  //   version: "0.6.6",
  //   settings: {
  //     optimizer: {
  //       enabled: true,
  //       runs: 999999,
  //       details: { yul: false },
  //     },
  //   },
  // },
  networks: {
    hydraChain: {
      url: process.env.HYDRA_CHAIN_RPC || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hydraTest: {
      url: process.env.HYDRA_TESTNET_RPC || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    devTest: {
      url: process.env.DEV_TEST_RPC || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      // allow impersonation of smart contracts without modifying balance
      gasPrice: 0,
      hardfork: "istanbul",
      allowUnlimitedContractSize: true,
    },
  },
};
