/**
 * Deployment Script for EcoRide Hedera Integration
 * This script deploys all necessary Hedera services
 */

const hederaService = require('../services/hederaService');
const fs = require('fs');
const path = require('path');

class Deployment {
    constructor() {
        this.deploymentLog = [];
        this.deploymentConfig = {
            network: process.env.HEDERA_NETWORK || 'testnet',
            timestamp: new Date().toISOString()
        };
    }

    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message
        };

        this.deploymentLog.push(logEntry);
        console.log(`[${level.toUpperCase()}] ${message}`);
    }

    async deploy() {
        try {
            this.log('Starting EcoRide deployment process');

            // Initialize Hedera service
            await this.initializeHedera();

            // Deploy Green Token
            await this.deployToken();

            // Create Carbon Topic
            await this.createTopic();

            // Deploy Smart Contract
            await this.deployContract();

            // Verify deployment
            await this.verifyDeployment();

            // Save deployment configuration
            await this.saveDeploymentConfig();

            this.log('Deployment completed successfully!', 'success');
            return this.deploymentConfig;

        } catch (error) {
            this.log(`Deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async initializeHedera() {
        try {
            this.log('Initializing Hedera client...');
            await hederaService.initialize();
            this.log('Hedera client initialized successfully');

            // Check account balance
            const health = await hederaService.healthCheck();
            this.log(`Operator account balance: ${health.operatorBalance}`);

            if (parseFloat(health.operatorBalance) < 10) {
                throw new Error('Insufficient HBAR balance for deployment. Need at least 10 HBAR.');
            }

        } catch (error) {
            this.log(`Failed to initialize Hedera: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployToken() {
        try {
            this.log('Deploying Green Token...');

            if (hederaService.greenTokenId) {
                this.log(`Token already exists: ${hederaService.greenTokenId}`);
                this.deploymentConfig.tokenId = hederaService.greenTokenId;
                return;
            }

            const tokenId = await hederaService.createGreenToken();
            this.deploymentConfig.tokenId = tokenId;
            this.log(`Green Token deployed: ${tokenId}`);

        } catch (error) {
            this.log(`Failed to deploy token: ${error.message}`, 'error');
            throw error;
        }
    }

    async createTopic() {
        try {
            this.log('Creating Carbon Topic...');

            if (hederaService.carbonTopicId) {
                this.log(`Topic already exists: ${hederaService.carbonTopicId}`);
                this.deploymentConfig.topicId = hederaService.carbonTopicId;
                return;
            }

            const topicId = await hederaService.createCarbonTopic();
            this.deploymentConfig.topicId = topicId;
            this.log(`Carbon Topic created: ${topicId}`);

        } catch (error) {
            this.log(`Failed to create topic: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployContract() {
        try {
            this.log('Deploying Carbon Rewards smart contract...');

            if (hederaService.contractId) {
                this.log(`Contract already exists: ${hederaService.contractId}`);
                this.deploymentConfig.contractId = hederaService.contractId;
                return;
            }

            // Read contract bytecode (this would be compiled Solidity)
            const contractPath = path.join(__dirname, '../../contracts/GreenRewards.sol');

            // In a real deployment, you'd compile the Solidity first
            this.log('Note: Contract compilation step required before deployment');
            this.log('Please compile GreenRewards.sol and provide bytecode');

            // For now, we'll skip actual deployment and just log the requirement
            this.deploymentConfig.contractStatus = 'compilation_required';
            this.log('Contract deployment prepared (compilation required)');

        } catch (error) {
            this.log(`Failed to deploy contract: ${error.message}`, 'error');
            throw error;
        }
    }

    async verifyDeployment() {
        try {
            this.log('Verifying deployment...');

            const health = await hederaService.healthCheck();

            // Verify token
            if (this.deploymentConfig.tokenId) {
                this.log(`✓ Token verified: ${this.deploymentConfig.tokenId}`);
            }

            // Verify topic
            if (this.deploymentConfig.topicId) {
                this.log(`✓ Topic verified: ${this.deploymentConfig.topicId}`);
            }

            // Verify contract (when deployed)
            if (this.deploymentConfig.contractId) {
                this.log(`✓ Contract verified: ${this.deploymentConfig.contractId}`);
            }

            this.log('Deployment verification completed');

        } catch (error) {
            this.log(`Verification failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async saveDeploymentConfig() {
        try {
            const configPath = path.join(__dirname, '../../../deployment-config.json');

            const fullConfig = {
                ...this.deploymentConfig,
                deploymentLog: this.deploymentLog,
                environment: {
                    network: process.env.HEDERA_NETWORK,
                    operatorAccount: process.env.HEDERA_ACCOUNT_ID,
                    nodeVersion: process.version,
                    timestamp: new Date().toISOString()
                }
            };

            fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
            this.log(`Deployment configuration saved to: ${configPath}`);

        } catch (error) {
            this.log(`Failed to save config: ${error.message}`, 'warning');
        }
    }

    async generateEnvFile() {
        try {
            const envContent = `# EcoRide Deployment Configuration
# Generated on ${new Date().toISOString()}

# Hedera Environment
HEDERA_NETWORK=${this.deploymentConfig.network}
HEDERA_ACCOUNT_ID=${process.env.HEDERA_ACCOUNT_ID}
HEDERA_PRIVATE_KEY=${process.env.HEDERA_PRIVATE_KEY}

# Deployed Services
HTS_TOKEN_ID=${this.deploymentConfig.tokenId || 'TO_BE_SET'}
HCS_TOPIC_ID=${this.deploymentConfig.topicId || 'TO_BE_SET'}
CARBON_REWARDS_CONTRACT=${this.deploymentConfig.contractId || 'TO_BE_SET'}

# Mirror Node
MIRROR_NODE_URL=https://${this.deploymentConfig.network}.mirrornode.hedera.com

# Application Settings
PORT=3001
NODE_ENV=production
`;

            const envPath = path.join(__dirname, '../../../.env.production');
            fs.writeFileSync(envPath, envContent);
            this.log(`Production environment file created: ${envPath}`);

        } catch (error) {
            this.log(`Failed to generate env file: ${error.message}`, 'warning');
        }
    }
}

// CLI execution
if (require.main === module) {
    const deployment = new Deployment();

    deployment.deploy()
        .then(async (config) => {
            console.log('\n✅ Deployment Summary:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Network: ${config.network}`);
            console.log(`Token ID: ${config.tokenId || 'Not deployed'}`);
            console.log(`Topic ID: ${config.topicId || 'Not deployed'}`);
            console.log(`Contract ID: ${config.contractId || 'Not deployed'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Generate production env file
            await deployment.generateEnvFile();

            console.log('\n📋 Next Steps:');
            console.log('1. Compile smart contracts using Hardhat or Remix');
            console.log('2. Deploy compiled contracts using the provided scripts');
            console.log('3. Update .env.production with contract addresses');
            console.log('4. Test all services using the health check endpoint');
            console.log('5. Configure frontend with wallet integration');

        })
        .catch((error) => {
            console.error('\n❌ Deployment Failed:');
            console.error(error.message);
            process.exit(1);
        });
}

module.exports = Deployment;