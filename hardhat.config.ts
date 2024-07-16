import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
// import "@nomiclabs/hardhat-etherscan"
import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "dotenv/config";
import "solidity-coverage";
import "hardhat-deploy";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/config";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      // saveDeployments: false,
      chainId: 11155111,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.8.9",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    buyer: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [],
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};

export default config;
