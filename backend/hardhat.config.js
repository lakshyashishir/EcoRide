require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      // Local development network - safe for compilation
    },
    "hedera-testnet": {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.HEDERA_OPERATOR_PRIVATE_KEY && process.env.HEDERA_OPERATOR_PRIVATE_KEY.length >= 64
        ? [process.env.HEDERA_OPERATOR_PRIVATE_KEY]
        : [],
      chainId: 296,
      gas: 2100000,
      gasPrice: 500000000000
    },
    "hedera-mainnet": {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.HEDERA_OPERATOR_PRIVATE_KEY && process.env.HEDERA_OPERATOR_PRIVATE_KEY.length >= 64
        ? [process.env.HEDERA_OPERATOR_PRIVATE_KEY]
        : [],
      chainId: 295,
      gas: 2100000,
      gasPrice: 500000000000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      "hedera-testnet": "test",
      "hedera-mainnet": "main"
    },
    customChains: [
      {
        network: "hedera-testnet",
        chainId: 296,
        urls: {
          apiURL: "https://hashscan.io/testnet/api",
          browserURL: "https://hashscan.io/testnet"
        }
      },
      {
        network: "hedera-mainnet",
        chainId: 295,
        urls: {
          apiURL: "https://hashscan.io/mainnet/api",
          browserURL: "https://hashscan.io/mainnet"
        }
      }
    ]
  }
};