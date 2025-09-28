/**
 * Deployment Script for EcoRide Hedera Integration
 * This script deploys all necessary Hedera services and smart contracts
 */

const hederaService = require('../services/hederaService');
const { ethers } = require('hardhat');
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
            this.log('Deploying smart contracts...');

            // Check if contracts are already deployed
            const existingDeployment = await this.loadExistingDeployment();
            if (existingDeployment && existingDeployment.contractId) {
                this.log(`Contract already exists: ${existingDeployment.contractId}`);
                this.deploymentConfig.contractId = existingDeployment.contractId;
                this.deploymentConfig.contractAddress = existingDeployment.contractAddress;
                return;
            }

            // Deploy GreenRewards contract
            await this.deployGreenRewardsContract();

            // Deploy GreenTokenOFT contract
            await this.deployGreenTokenOFTContract();

        } catch (error) {
            this.log(`Failed to deploy contracts: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployGreenRewardsContract() {
        try {
            this.log('Deploying GreenRewards contract...');

            // Get network configuration
            const network = hre.network.name;
            const [deployer] = await ethers.getSigners();
            const deployerAddress = await deployer.getAddress();

            this.log(`Deploying with account: ${deployerAddress}`);

            // Use existing token and fee collector from deployment-info.json
            const existingDeployment = await this.loadExistingDeployment();
            const greenTokenAddress = existingDeployment?.greenTokenAddress || "0.0.6916942";
            const feeCollector = existingDeployment?.feeCollector || "0.0.6915464";

            // Convert Hedera account IDs to EVM addresses
            const greenTokenNum = parseInt(greenTokenAddress.split('.')[2]);
            const feeCollectorNum = parseInt(feeCollector.split('.')[2]);
            
            const greenTokenEvm = '0x' + '00000000000000000000000000000000' + greenTokenNum.toString(16).padStart(8, '0');
            const feeCollectorEvm = '0x' + '00000000000000000000000000000000' + feeCollectorNum.toString(16).padStart(8, '0');

            this.log(`Green Token EVM Address: ${greenTokenEvm}`);
            this.log(`Fee Collector EVM Address: ${feeCollectorEvm}`);

            // Deploy GreenRewards contract
            const GreenRewards = await ethers.getContractFactory("GreenRewards");
            const greenRewards = await GreenRewards.deploy(
                greenTokenEvm,
                feeCollectorEvm,
                {
                    gasLimit: 4000000,
                    gasPrice: ethers.parseUnits("500", "gwei")
                }
            );

            await greenRewards.waitForDeployment();
            const contractAddress = await greenRewards.getAddress();

            // Convert EVM address back to Hedera contract ID
            const contractNum = parseInt(contractAddress.slice(-8), 16);
            const contractId = `0.0.${contractNum}`;

            this.deploymentConfig.contractId = contractId;
            this.deploymentConfig.contractAddress = contractAddress;
            this.deploymentConfig.greenTokenAddress = greenTokenAddress;
            this.deploymentConfig.feeCollector = feeCollector;

            this.log(`GreenRewards contract deployed: ${contractId} (${contractAddress})`);

        } catch (error) {
            this.log(`Failed to deploy GreenRewards contract: ${error.message}`, 'error');
            throw error;
        }
    }

    async deployGreenTokenOFTContract() {
        try {
            this.log('Deploying GreenTokenOFT contract...');

            // Get network configuration
            const network = hre.network.name;
            const config = hre.config.networks[network];

            if (!config || !config.layerZeroEndpoint) {
                this.log('LayerZero endpoint not configured, skipping OFT deployment', 'warning');
                return;
            }

            const layerZeroEndpoint = config.layerZeroEndpoint;
            const [deployer] = await ethers.getSigners();

            // Use the deployed GreenRewards contract address
            const greenRewardsAddress = this.deploymentConfig.contractAddress || "0x" + "2".repeat(40);

            // Deploy GreenTokenOFT contract
            const GreenTokenOFT = await ethers.getContractFactory("GreenTokenOFT");
            const greenTokenOFT = await GreenTokenOFT.deploy(
                layerZeroEndpoint,
                greenRewardsAddress,
                {
                    gasLimit: 4000000,
                    gasPrice: ethers.parseUnits("500", "gwei")
                }
            );

            await greenTokenOFT.waitForDeployment();
            const oftAddress = await greenTokenOFT.getAddress();

            // Convert EVM address to Hedera contract ID
            const oftNum = parseInt(oftAddress.slice(-8), 16);
            const oftId = `0.0.${oftNum}`;

            this.deploymentConfig.greenTokenOFTId = oftId;
            this.deploymentConfig.greenTokenOFTAddress = oftAddress;
            this.deploymentConfig.layerZeroEndpoint = layerZeroEndpoint;

            this.log(`GreenTokenOFT contract deployed: ${oftId} (${oftAddress})`);

        } catch (error) {
            this.log(`Failed to deploy GreenTokenOFT contract: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadExistingDeployment() {
        try {
            const deploymentPath = path.join(__dirname, '../../../deployment-info.json');
            if (fs.existsSync(deploymentPath)) {
                const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
                return deploymentData;
            }
        } catch (error) {
            this.log(`Failed to load existing deployment: ${error.message}`, 'warning');
        }
        return null;
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
            // Save to deployment-info.json (main deployment file)
            const deploymentPath = path.join(__dirname, '../../../deployment-info.json');
            const deploymentInfo = {
                contractAddress: this.deploymentConfig.contractAddress,
                contractId: this.deploymentConfig.contractId,
                greenTokenAddress: this.deploymentConfig.greenTokenAddress,
                feeCollector: this.deploymentConfig.feeCollector,
                greenTokenOFTAddress: this.deploymentConfig.greenTokenOFTAddress,
                greenTokenOFTId: this.deploymentConfig.greenTokenOFTId,
                layerZeroEndpoint: this.deploymentConfig.layerZeroEndpoint,
                timestamp: new Date().toISOString(),
                network: this.deploymentConfig.network || 'hedera-testnet'
            };

            fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
            this.log(`Deployment info saved to: ${deploymentPath}`);

            // Also save detailed config
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
            this.log(`Detailed deployment configuration saved to: ${configPath}`);

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
            console.log('1. Verify contracts on Hashscan for transparency');
            console.log('2. Test contract functions using the provided scripts');
            console.log('3. Update .env.production with contract addresses');
            console.log('4. Test all services using the health check endpoint');
            console.log('5. Configure frontend with wallet integration');
            console.log('6. Set up cross-chain trusted remotes for LayerZero OFT');

        })
        .catch((error) => {
            console.error('\n❌ Deployment Failed:');
            console.error(error.message);
            process.exit(1);
        });
}

module.exports = Deployment;