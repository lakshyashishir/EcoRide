require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
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
      gasPrice: 500000000000,
      // LayerZero endpoint for Hedera testnet
      layerZeroEndpoint: "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab"
    },
    "hedera-mainnet": {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.HEDERA_OPERATOR_PRIVATE_KEY && process.env.HEDERA_OPERATOR_PRIVATE_KEY.length >= 64
        ? [process.env.HEDERA_OPERATOR_PRIVATE_KEY]
        : [],
      chainId: 295,
      gas: 2100000,
      gasPrice: 500000000000,
      // LayerZero endpoint for Hedera mainnet
      layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62"
    },
    // Additional networks for cross-chain testing
    "ethereum-sepolia": {
      url: process.env.ETHEREUM_SEPOLIA_RPC || "https://sepolia.infura.io/v3/YOUR_KEY",
      accounts: process.env.HEDERA_OPERATOR_PRIVATE_KEY && process.env.HEDERA_OPERATOR_PRIVATE_KEY.length >= 64
        ? [process.env.HEDERA_OPERATOR_PRIVATE_KEY]
        : [],
      chainId: 11155111,
      layerZeroEndpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1"
    },
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: process.env.HEDERA_OPERATOR_PRIVATE_KEY && process.env.HEDERA_OPERATOR_PRIVATE_KEY.length >= 64
        ? [process.env.HEDERA_OPERATOR_PRIVATE_KEY]
        : [],
      chainId: 97,
      layerZeroEndpoint: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1"
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