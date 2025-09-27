# EcoRide Frontend

EcoRide is a sustainable transit rewards platform built for the Hedera ecosystem, featuring cross-chain interoperability via LayerZero.

## Features

- 🌱 **GREEN Token Rewards**: Earn tokens for eco-friendly metro journeys
- 🌉 **Cross-Chain Bridge**: Transfer GREEN tokens across multiple blockchains using LayerZero
- 🏆 **Leaderboards**: Community rankings and achievements
- 💳 **Hedera Wallet Integration**: Native wallet support for seamless transactions
- 📊 **Analytics Dashboard**: Track your environmental impact and rewards

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cross-Chain Bridge

Access the LayerZero-powered cross-chain bridge at `/bridge` to transfer GREEN tokens between:
- Hedera Testnet
- Ethereum Sepolia
- BSC Testnet

## Smart Contracts

- **GreenTokenOFT**: `0x00FB10E037C58DcD0AF7911404E67D3124226b53` (Hedera Testnet)
- **LayerZero Integration**: Cross-chain interoperability for GREEN tokens

## Hedera EVM Track

This project qualifies for the Hedera EVM Track with:
- ✅ Smart Contract deployment on Hedera Testnet
- ✅ LayerZero cross-chain bridge integration
- ✅ Verified contracts on Hashscan
- ✅ Production-ready frontend interface

For deployment instructions, see `CROSS_CHAIN_SETUP.md`.
