# Deploy V3 Uniswap Contracts

### Uniswap Contracts Repository:

- https://github.com/Uniswap/v2-core
- https://github.com/Uniswap/v2-periphery
- https://github.com/Uniswap/v3-core
- https://github.com/Uniswap/v3-periphery
- https://github.com/Uniswap/swap-router-contracts

### Usage
The deployment scripts, under the main function, have the command for the script, just use it:
(Change owner comments if you don’t use localhost and set your key in .env + RPC)
- 0 - 1st we deploy Weth9 and 2 Tokens (for testing “Remove tokens on Prod”)
(use Weth compiler version in hardhat)
If you already have Weth9, set in .env.local “WETH_ADDRESS” and continue!
- 1 - Then we deploy V2 contracts (use V2 compiler version in hardhat “comment sol files”)
- 2 - Deploy V3 factory and other independent contracts for v3 (use V3 compiler version)
- 3 - Finally we deploy other V3 contracts that need previous ones (use V3 compiler version)
- 4 - Scripts for adding Pair in V2 or Adding Pool + Liquidity for V3 (just for local testing)
<br>
The addresses of the deployed contracts are saved in .env.local<br>
The .env is for your private key and the RPC<br>
If you run script “0” again (1st deployment it will delete all in .env.local) other files just append
