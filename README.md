# 🌱 EcoRide - Sustainable Transit Rewards Platform

[![Hedera](https://img.shields.io/badge/Hedera-Blockchain-purple)](https://hedera.com/)
[![LayerZero](https://img.shields.io/badge/LayerZero-Cross--Chain-blue)](https://layerzero.network/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

EcoRide is a revolutionary blockchain-powered platform that rewards sustainable transit choices with GREEN tokens. Built on the Hedera network with cross-chain capabilities via LayerZero, EcoRide gamifies eco-friendly transportation to create a greener future.

## 🚀 Overview

EcoRide transforms public transportation into a rewarding experience by:
- **Rewarding** users with GREEN tokens for metro journeys
- **Tracking** real-time carbon savings from sustainable transit choices
- **Enabling** cross-chain token transfers via LayerZero
- **Preventing** fraud with AI-powered journey verification
- **Building** a community of environmentally conscious commuters

## ✨ Features

### 🌿 Core Features
- **GREEN Token Rewards**: Earn blockchain tokens for every eco-friendly metro journey
- **QR Code Journey Verification**: Scan metro tickets to verify and record journeys
- **Real-time Carbon Tracking**: Monitor your environmental impact with precise CO2 savings
- **Smart Contract Integration**: Transparent, secure reward distribution via Hedera smart contracts
- **Anti-fraud System**: AI-powered verification to prevent system abuse

### 🌉 Cross-Chain Capabilities
- **LayerZero Bridge**: Transfer GREEN tokens across multiple blockchains
- **Multi-chain Support**: Hedera, Ethereum, BSC, and more
- **Seamless Interoperability**: Bridge tokens without leaving the platform

### 🏆 Community Features
- **Leaderboards**: Global and local rankings based on carbon savings
- **Journey History**: Complete record of all eco-friendly trips
- **Achievement System**: Unlock badges and milestones
- **Social Impact Metrics**: View collective community environmental impact

### 💼 Merchant Integration
- **Token Redemption**: Use GREEN tokens at partner merchants
- **Dynamic Fee System**: Configurable merchant fees (1-3%)
- **Real-world Utility**: Convert environmental action into tangible benefits

## 🏗️ Architecture

### Frontend (`/fronted`)
- **Framework**: Next.js 15.5.4 with React 19
- **Styling**: Tailwind CSS with custom themes
- **Wallet Integration**: Hedera Wallet Connect
- **Components**: Modular React components with TypeScript
- **State Management**: React Context for wallet and app state

### Backend (`/backend`)
- **Runtime**: Node.js with Express.js
- **Blockchain**: Hedera SDK for native integration
- **AI**: Hedera Agent Kit for fraud detection
- **Security**: Helmet, CORS, rate limiting, and DDoS protection
- **Validation**: Express-validator and Joi schemas

### Smart Contracts (`/backend/contracts`)
- **GreenRewards.sol**: Main rewards contract with HTS integration
- **LayerZero OFT**: Cross-chain token implementation
- **Deployment**: Hardhat-based deployment on Hedera Testnet

## 🛠️ Tech Stack

### Blockchain & Web3
- **Hedera Hashgraph**: Primary blockchain platform
- **Hedera Token Service (HTS)**: Native token management
- **LayerZero**: Cross-chain interoperability protocol
- **Solidity**: Smart contract development
- **Hardhat**: Contract compilation and deployment

### Frontend Technologies
- **Next.js 15.5.4**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **QR Scanner**: Camera-based QR code reading

### Backend Technologies
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Hedera SDK**: Blockchain integration
- **Hedera Agent Kit**: AI-powered fraud detection
- **Winston**: Logging framework
- **Multer**: File upload handling

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn
- **Hedera Testnet Account** with HBAR balance
- **Git** for version control

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/lakshyashishir/EcoRide.git
cd EcoRide
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd fronted
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Setup

#### Backend Configuration (`/backend/.env`)
```env
# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=your_account_id
HEDERA_PRIVATE_KEY=your_private_key

# Contract Addresses
GREEN_TOKEN_ADDRESS=0x00FB10E037C58DcD0AF7911404E67D3124226b53
REWARDS_CONTRACT_ADDRESS=your_rewards_contract

# API Configuration
PORT=3001
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Agent Configuration
OPENAI_API_KEY=your_openai_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_key
```

#### Frontend Configuration (`/fronted/.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_GREEN_TOKEN_ID=0.0.your_token_id
```

### 4. Deploy Smart Contracts
```bash
cd backend

# Compile contracts
npm run compile

# Deploy to Hedera Testnet
npm run deploy

# Deploy LayerZero bridge (optional)
npm run deploy:oft
```

### 5. Start Development Servers

#### Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

#### Frontend Server
```bash
cd fronted
npm run dev
# Frontend runs on http://localhost:3000
```

## 📱 Usage Guide

### For Commuters

1. **Connect Wallet**: Use Hedera Wallet Connect to link your account
2. **Take Metro Journey**: Travel using public transportation
3. **Scan QR Code**: Use the app to scan your metro ticket
4. **Earn Rewards**: Receive GREEN tokens based on carbon savings
5. **Track Impact**: Monitor your environmental contribution

### For Merchants

1. **Partner Integration**: Contact team for merchant onboarding
2. **Accept GREEN Tokens**: Integrate token redemption system
3. **Configure Fees**: Set merchant fee percentage (1-3%)
4. **Process Payments**: Real-time token-to-service conversion

## 🔗 Smart Contract Addresses

### Hedera Testnet
- **GreenTokenOFT**: `0x00FB10E037C58DcD0AF7911404E67D3124226b53`
- **GreenRewards**: Deployed via deployment scripts
- **HTS Precompile**: `0x167` (native Hedera service)

### Cross-Chain Deployments
- **Ethereum Sepolia**: Available via LayerZero bridge
- **BSC Testnet**: Available via LayerZero bridge

## 🛡️ Security Features

### Smart Contract Security
- **OpenZeppelin Standards**: Battle-tested contract templates
- **HTS Integration**: Native Hedera token security
- **Anti-fraud Mechanisms**: Journey validation and limits
- **Access Controls**: Owner-only administrative functions

### Backend Security
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Controlled cross-origin requests
- **DDoS Protection**: Traffic filtering and limiting
- **Helmet Security**: HTTP security headers

### Frontend Security
- **Environment Variables**: Secure configuration management
- **Wallet Integration**: Secure Hedera wallet connection
- **Type Safety**: TypeScript for compile-time error prevention

## 🧪 Testing

### Smart Contract Tests
```bash
cd backend
npx hardhat test
```

### Backend API Tests
```bash
cd backend
npm test
```

### Frontend Component Tests
```bash
cd fronted
npm test
```

## 📈 Performance Metrics

### Carbon Impact Calculation
- **Emission Factor**: 0.21 kg CO2/km for cars vs 0.041 kg CO2/km for metro
- **Reward Calculation**: 10 GREEN tokens per kg CO2 saved
- **Daily Limits**: Maximum 1000 GREEN tokens per user per day

### Network Performance
- **Hedera TPS**: 10,000+ transactions per second
- **Transaction Finality**: 3-5 seconds
- **Gas Costs**: Predictable HBAR-based fees

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- **TypeScript**: Use strong typing
- **ESLint**: Follow linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Descriptive commit messages

## 📚 API Documentation

### Core Endpoints

#### Journey Management
```
POST /api/metro/journey
GET  /api/metro/history/:walletId
GET  /api/metro/leaderboard
```

#### Hedera Integration
```
POST /api/hedera/setup
GET  /api/hedera/health
POST /api/hedera/associate-token
```

#### Carbon Tracking
```
POST /api/carbon/calculate
GET  /api/carbon/stats/:walletId
```

#### Fraud Detection
```
POST /api/fraud-check/journey
GET  /api/fraud-check/analysis/:journeyId
```

## 🔮 Roadmap

### Phase 1: Core Platform (✅ Complete)
- Basic journey recording and token rewards
- Hedera integration and smart contracts
- Web interface and wallet connection

### Phase 2: Cross-Chain Expansion (✅ Complete)
- LayerZero bridge integration
- Multi-chain token support
- Enhanced security features

### Phase 3: AI & Analytics (🚧 In Progress)
- Advanced fraud detection
- Predictive carbon analytics
- Route optimization suggestions

### Phase 4: Ecosystem Growth (📋 Planned)
- Mobile application
- More transit system integrations
- Corporate partnerships
- DAO governance

## 🌍 Environmental Impact

EcoRide is designed to create measurable environmental benefits:

- **Carbon Reduction**: Each metro journey saves approximately 169g CO2 vs car travel
- **Behavioral Change**: Gamification encourages sustainable transport choices
- **Community Building**: Collective action for environmental goals
- **Data Transparency**: Blockchain-verified impact metrics

## 🏆 Awards & Recognition

- **Hedera EVM Track**: Qualifying project for Hedera hackathons
- **LayerZero Integration**: Cross-chain interoperability showcase
- **Sustainable Innovation**: Green technology demonstration

## 📞 Support & Community

- **Documentation**: [Project Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Discord**: [Community Chat](https://discord.gg/ecoride)
- **Twitter**: [@EcoRideApp](https://twitter.com/ecoride)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hedera Team**: For the robust blockchain platform
- **LayerZero**: For cross-chain infrastructure
- **OpenZeppelin**: For secure smart contract templates
- **Metro Systems**: For enabling sustainable transit data

---

**Built with ❤️ for a sustainable future**

*EcoRide - Where every journey counts towards a greener tomorrow* 🌱