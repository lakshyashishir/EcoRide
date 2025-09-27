#!/usr/bin/env node

/**
 * EcoRide Hedera Testnet Setup Script
 *
 * This script helps set up Hedera testnet accounts and initial configuration
 * for the EcoRide platform.
 */

const { Client, AccountCreateTransaction, PrivateKey, Hbar, AccountId } = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class TestnetSetup {
    constructor() {
        this.client = null;
        this.operatorAccount = null;
        this.operatorKey = null;
        this.treasuryAccount = null;
        this.treasuryKey = null;
    }

    async setupInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    async displayWelcome() {
        console.log('\n🌿 EcoRide Hedera Testnet Setup');
        console.log('='.repeat(40));
        console.log('This script will help you set up your Hedera testnet environment.\n');

        console.log('📋 What this script will do:');
        console.log('1. Guide you through obtaining testnet accounts');
        console.log('2. Create or update your .env file');
        console.log('3. Verify your account setup');
        console.log('4. Test basic Hedera connectivity\n');

        const proceed = await this.askQuestion('Do you want to proceed? (y/n): ');
        if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
            console.log('Setup cancelled.');
            process.exit(0);
        }
    }

    async getAccountCredentials() {
        console.log('\n🔑 Hedera Account Setup');
        console.log('-'.repeat(30));

        console.log('\n📖 To get testnet accounts:');
        console.log('1. Visit: https://portal.hedera.com/register');
        console.log('2. Create a free account');
        console.log('3. Go to "Testnet" section');
        console.log('4. Create new testnet accounts (you need 2 accounts)');
        console.log('5. Copy the Account ID and Private Key for each account\n');

        // Get operator account credentials
        console.log('🔐 Operator Account (for general operations):');
        const operatorAccountId = await this.askQuestion('Enter Operator Account ID (0.0.XXXXXXX): ');
        const operatorPrivateKey = await this.askQuestion('Enter Operator Private Key: ');

        // Get treasury account credentials
        console.log('\n💰 Treasury Account (for token operations):');
        const treasuryAccountId = await this.askQuestion('Enter Treasury Account ID (0.0.XXXXXXX): ');
        const treasuryPrivateKey = await this.askQuestion('Enter Treasury Private Key: ');

        return {
            operatorAccountId: operatorAccountId.trim(),
            operatorPrivateKey: operatorPrivateKey.trim(),
            treasuryAccountId: treasuryAccountId.trim(),
            treasuryPrivateKey: treasuryPrivateKey.trim()
        };
    }

    async validateCredentials(credentials) {
        console.log('\n🔍 Validating account credentials...');

        try {
            // Validate account ID format
            AccountId.fromString(credentials.operatorAccountId);
            AccountId.fromString(credentials.treasuryAccountId);
            console.log('✅ Account ID format is valid');

            // Validate private key format
            PrivateKey.fromString(credentials.operatorPrivateKey);
            PrivateKey.fromString(credentials.treasuryPrivateKey);
            console.log('✅ Private key format is valid');

            return true;
        } catch (error) {
            console.error('❌ Credential validation failed:', error.message);
            return false;
        }
    }

    async testConnectivity(credentials) {
        console.log('\n🌐 Testing Hedera testnet connectivity...');

        try {
            // Create Hedera client
            this.client = Client.forTestnet();
            this.client.setOperator(
                AccountId.fromString(credentials.operatorAccountId),
                PrivateKey.fromString(credentials.operatorPrivateKey)
            );

            // Test operator account balance
            const { AccountBalanceQuery } = require('@hashgraph/sdk');
            const operatorBalance = await new AccountBalanceQuery()
                .setAccountId(credentials.operatorAccountId)
                .execute(this.client);

            console.log(`✅ Operator account balance: ${operatorBalance.hbars} HBAR`);

            // Test treasury account balance
            const treasuryBalance = await new AccountBalanceQuery()
                .setAccountId(credentials.treasuryAccountId)
                .execute(this.client);

            console.log(`✅ Treasury account balance: ${treasuryBalance.hbars} HBAR`);

            // Check minimum balance
            if (operatorBalance.hbars.toTinybars().toNumber() < 100000000) { // 1 HBAR = 100,000,000 tinybars
                console.warn('⚠️  Warning: Operator account has low HBAR balance. You may need more for transactions.');
            }

            if (treasuryBalance.hbars.toTinybars().toNumber() < 100000000) {
                console.warn('⚠️  Warning: Treasury account has low HBAR balance. You may need more for token operations.');
            }

            return true;
        } catch (error) {
            console.error('❌ Connectivity test failed:', error.message);
            return false;
        }
    }

    async createEnvFile(credentials) {
        console.log('\n📄 Creating .env file...');

        const envContent = `# Hedera Network Configuration
# Generated by EcoRide setup script on ${new Date().toISOString()}

# Operator Account (for general Hedera operations)
HEDERA_OPERATOR_ACCOUNT_ID=${credentials.operatorAccountId}
HEDERA_OPERATOR_PRIVATE_KEY=${credentials.operatorPrivateKey}

# Treasury Account (for token operations and minting)
HEDERA_TREASURY_ACCOUNT_ID=${credentials.treasuryAccountId}
HEDERA_TREASURY_PRIVATE_KEY=${credentials.treasuryPrivateKey}

# Network Configuration
HEDERA_NETWORK=testnet
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# GREEN Token Configuration (will be populated after token creation)
GREEN_TOKEN_ID=
GREEN_TOKEN_SYMBOL=GREEN
GREEN_TOKEN_NAME=GreenToken
GREEN_TOKEN_DECIMALS=2
GREEN_TOKEN_INITIAL_SUPPLY=0

# HCS Configuration (will be populated after topic creation)
HCS_TOPIC_ID=

# Smart Contract Configuration (will be populated after deployment)
GREEN_REWARDS_CONTRACT_ID=
EVM_CONTRACT_ADDRESS=

# Application Configuration
PORT=3001
NODE_ENV=development
USE_MOCK=false

# Carbon Calculation Constants
METRO_EMISSION_FACTOR=33
CAR_EMISSION_FACTOR=171
AUTO_EMISSION_FACTOR=145
BASE_REWARD_MULTIPLIER=10
MAX_DAILY_REWARDS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=http://localhost:3000
`;

        const envPath = path.join(__dirname, '..', '.env');

        // Check if .env already exists
        if (fs.existsSync(envPath)) {
            const overwrite = await this.askQuestion('.env file already exists. Overwrite? (y/n): ');
            if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
                console.log('Skipping .env file creation.');
                return false;
            }
        }

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully');
        console.log(`📍 Location: ${envPath}`);

        return true;
    }

    async provideFaucetInstructions() {
        console.log('\n💰 Hedera Testnet Faucet Instructions');
        console.log('-'.repeat(40));
        console.log('If your accounts need more HBAR for testing:');
        console.log('');
        console.log('1. Visit: https://portal.hedera.com/dashboard');
        console.log('2. Go to "Testnet" section');
        console.log('3. Click "Request HBAR" for each account');
        console.log('4. You can request up to 1000 HBAR per day per account');
        console.log('');
        console.log('Note: Testnet HBAR has no real value and is only for testing.');
    }

    async displayNextSteps() {
        console.log('\n🎉 Setup Complete!');
        console.log('='.repeat(20));
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Start the backend server: npm run dev');
        console.log('2. Test the health endpoint: GET /api/hedera/health');
        console.log('3. Initialize Hedera services: POST /api/hedera/setup');
        console.log('4. Create GREEN token and HCS topic');
        console.log('5. Deploy smart contracts');
        console.log('');
        console.log('📚 Useful commands:');
        console.log('- npm test                    # Run tests');
        console.log('- npm run dev                 # Start development server');
        console.log('- npm run dev:mock           # Start with mock services');
        console.log('');
        console.log('🔗 Useful links:');
        console.log('- Hedera Portal: https://portal.hedera.com');
        console.log('- HashScan (Testnet): https://hashscan.io/testnet');
        console.log('- Hedera Docs: https://docs.hedera.com');
        console.log('');
        console.log('💡 Tip: Save your account IDs and check transactions on HashScan!');
    }

    async run() {
        try {
            await this.setupInterface();
            await this.displayWelcome();

            const credentials = await this.getAccountCredentials();

            const isValid = await this.validateCredentials(credentials);
            if (!isValid) {
                console.log('\n❌ Please check your credentials and try again.');
                process.exit(1);
            }

            const isConnected = await this.testConnectivity(credentials);
            if (!isConnected) {
                console.log('\n❌ Could not connect to Hedera testnet. Please check your credentials.');
                process.exit(1);
            }

            await this.createEnvFile(credentials);
            await this.provideFaucetInstructions();
            await this.displayNextSteps();

        } catch (error) {
            console.error('\n💥 Setup failed:', error.message);
            console.log('\nPlease try again or check the documentation.');
            process.exit(1);
        } finally {
            if (this.client) {
                this.client.close();
            }
            if (this.rl) {
                this.rl.close();
            }
        }
    }
}

// Run the setup if called directly
if (require.main === module) {
    const setup = new TestnetSetup();
    setup.run()
        .then(() => {
            console.log('\n✨ EcoRide testnet setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error);
            process.exit(1);
        });
}

module.exports = TestnetSetup;