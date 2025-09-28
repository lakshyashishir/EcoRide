const {
    Client,
    PrivateKey,
    AccountId,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    ContractCreateFlow,
    ContractExecuteTransaction,
    Hbar,
    FileCreateTransaction,
    FileAppendTransaction,
    TransferTransaction,
    AccountBalanceQuery
} = require('@hashgraph/sdk');
const { hederaConfig } = require('../config/hedera');

class HederaService {
    constructor() {
        this.client = null;
        this.operatorAccount = null;
        this.operatorKey = null;
        this.greenTokenId = null;
        this.carbonTopicId = null;
        this.contractId = null;
        this.mirrorNodeUrl = process.env.MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
    }

    /**
     * Initialize Hedera client with credentials
     */
    async initialize() {
        try {
            // Setup client for testnet
            const network = process.env.HEDERA_NETWORK || 'testnet';
            this.client = Client.forTestnet();

            // Set operator account
            this.operatorAccount = AccountId.fromString(process.env.HEDERA_OPERATOR_ACCOUNT_ID);
            this.operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_PRIVATE_KEY);

            this.client.setOperator(this.operatorAccount, this.operatorKey);

            // Set existing token and topic IDs if available
            if (process.env.GREEN_TOKEN_ID) {
                this.greenTokenId = process.env.GREEN_TOKEN_ID;
            }
            if (process.env.HCS_TOPIC_ID) {
                this.carbonTopicId = process.env.HCS_TOPIC_ID;
            }
            if (process.env.GREEN_REWARDS_CONTRACT_ID) {
                this.contractId = process.env.GREEN_REWARDS_CONTRACT_ID;
            }


            return true;
        } catch (error) {
            console.error('Failed to initialize Hedera service:', error);
            throw error;
        }
    }

    /**
     * Create the GreenToken using HTS
     */
    async createGreenToken() {
        try {
            const tokenName = process.env.GREEN_TOKEN_NAME || 'GreenToken';
            const tokenSymbol = process.env.GREEN_TOKEN_SYMBOL || 'GREEN';

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName(tokenName)
                .setTokenSymbol(tokenSymbol)
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(18)
                .setInitialSupply(0) // Start with 0, mint on demand
                .setSupplyType(TokenSupplyType.Infinite)
                .setTreasuryAccountId(this.operatorAccount)
                .setSupplyKey(this.operatorKey)
                .setAdminKey(this.operatorKey)
                .setFreezeDefault(false)
                .freezeWith(this.client);

            const tokenCreateSign = await tokenCreateTx.sign(this.operatorKey);
            const tokenCreateSubmit = await tokenCreateSign.execute(this.client);
            const tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);

            this.greenTokenId = tokenCreateRx.tokenId.toString();

            return this.greenTokenId;
        } catch (error) {
            console.error('Failed to create Green Token:', error);
            throw error;
        }
    }

    /**
     * Create HCS topic for carbon records
     */
    async createCarbonTopic() {
        try {
            const topicCreateTx = new TopicCreateTransaction()
                .setTopicMemo('EcoRide Carbon Records')
                .setSubmitKey(this.operatorKey)
                .setAdminKey(this.operatorKey)
                .freezeWith(this.client);

            const topicCreateSign = await topicCreateTx.sign(this.operatorKey);
            const topicCreateSubmit = await topicCreateSign.execute(this.client);
            const topicCreateRx = await topicCreateSubmit.getReceipt(this.client);

            this.carbonTopicId = topicCreateRx.topicId.toString();

            return this.carbonTopicId;
        } catch (error) {
            console.error('Failed to create carbon topic:', error);
            throw error;
        }
    }

    /**
     * Submit carbon record to HCS topic
     */
    async submitCarbonRecord(journeyData) {
        try {
            const message = JSON.stringify({
                journeyId: journeyData.journeyId,
                userId: journeyData.userId,
                fromStation: journeyData.fromStation,
                toStation: journeyData.toStation,
                distance: journeyData.distance,
                carbonSaved: journeyData.carbonSaved,
                timestamp: new Date().toISOString(),
                platform: 'EcoRide'
            });

            const topicMessageTx = new TopicMessageSubmitTransaction()
                .setTopicId(this.carbonTopicId || process.env.HCS_TOPIC_ID)
                .setMessage(message)
                .freezeWith(this.client);

            const topicMessageSign = await topicMessageTx.sign(this.operatorKey);
            const topicMessageSubmit = await topicMessageSign.execute(this.client);
            const topicMessageRx = await topicMessageSubmit.getReceipt(this.client);

            console.log(`Carbon record submitted to HCS: ${topicMessageRx.topicSequenceNumber}`);
            return {
                sequenceNumber: topicMessageRx.topicSequenceNumber.toString(),
                transactionId: topicMessageSubmit.transactionId.toString()
            };
        } catch (error) {
            console.error('Failed to submit carbon record:', error);
            throw error;
        }
    }

    /**
     * Deploy the Carbon Rewards smart contract
     */
    async deployContract(contractBytecode) {
        try {
            // Create file for contract bytecode
            const fileCreateTx = new FileCreateTransaction()
                .setKeys([this.operatorKey])
                .setContents(contractBytecode)
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(this.client);

            const fileCreateSign = await fileCreateTx.sign(this.operatorKey);
            const fileCreateSubmit = await fileCreateSign.execute(this.client);
            const fileCreateRx = await fileCreateSubmit.getReceipt(this.client);
            const bytecodeFileId = fileCreateRx.fileId;

            // Deploy contract
            const contractCreateTx = new ContractCreateFlow()
                .setBytecodeFileId(bytecodeFileId)
                .setGas(2000000)
                .setConstructorParameters([this.greenTokenId]) // GreenToken address
                .setMaxTransactionFee(new Hbar(5))
                .freezeWith(this.client);

            const contractCreateSign = await contractCreateTx.sign(this.operatorKey);
            const contractCreateSubmit = await contractCreateSign.execute(this.client);
            const contractCreateRx = await contractCreateSubmit.getReceipt(this.client);

            this.contractId = contractCreateRx.contractId.toString();

            console.log(`Contract deployed: ${this.contractId}`);
            return this.contractId;
        } catch (error) {
            console.error('Failed to deploy contract:', error);
            throw error;
        }
    }

    /**
     * Record a journey and distribute rewards via smart contract
     */
    async recordJourneyAndReward(journeyData, userAddress) {
        try {
            // First submit to HCS for immutable record
            const hcsRecord = await this.submitCarbonRecord(journeyData);

            // Then call smart contract to calculate and distribute rewards
            const contractExecuteTx = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    'recordJourney',
                    [
                        journeyData.journeyId,
                        journeyData.fromStation,
                        journeyData.toStation,
                        journeyData.distance,
                        userAddress
                    ]
                )
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(this.client);

            const contractExecuteSign = await contractExecuteTx.sign(this.operatorKey);
            const contractExecuteSubmit = await contractExecuteSign.execute(this.client);
            const contractExecuteRx = await contractExecuteSubmit.getReceipt(this.client);

            console.log(`Journey recorded in contract: ${contractExecuteSubmit.transactionId}`);

            return {
                contractTransactionId: contractExecuteSubmit.transactionId.toString(),
                hcsSequenceNumber: hcsRecord.sequenceNumber,
                hcsTransactionId: hcsRecord.transactionId
            };
        } catch (error) {
            console.error('Failed to record journey and reward:', error);
            throw error;
        }
    }

    /**
     * Get account balance for Green Tokens
     */
    async getTokenBalance(accountId) {
        try {
            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(accountId)
                .execute(this.client);

            const tokenBalance = accountBalance.tokens.get(this.greenTokenId);
            return tokenBalance ? tokenBalance.toString() : '0';
        } catch (error) {
            console.error('Failed to get token balance:', error);
            throw error;
        }
    }

    /**
     * Get transaction details from Mirror Node
     */
    async getTransactionDetails(transactionId) {
        try {
            const response = await fetch(
                `${this.mirrorNodeUrl}/api/v1/transactions/${transactionId}`
            );

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get transaction details:', error);
            throw error;
        }
    }

    /**
     * Get user statistics from contract
     */
    async getUserStats(userAddress) {
        try {
            // This would typically use contract call functionality
            // For now, we'll use Mirror Node to query contract state

            const response = await fetch(
                `${this.mirrorNodeUrl}/api/v1/contracts/${this.contractId}/results/logs?account.id=${userAddress}`
            );

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status}`);
            }

            const data = await response.json();
            return this.parseUserStatsFromLogs(data.logs);
        } catch (error) {
            console.error('Failed to get user stats:', error);
            throw error;
        }
    }

    /**
     * Parse user statistics from contract event logs
     */
    parseUserStatsFromLogs(logs) {
        let totalCarbonSaved = 0;
        let totalTokensEarned = 0;
        let totalJourneys = 0;

        for (const log of logs) {
            if (log.topics && log.topics[0] === 'JourneyRecorded') {
                totalJourneys++;
                // Parse carbon saved and tokens earned from log data
                // This is a simplified version - in practice you'd need to decode the log data properly
            }
        }

        return {
            totalCarbonSaved,
            totalTokensEarned,
            totalJourneys
        };
    }

    /**
     * Health check for Hedera connectivity
     */
    async healthCheck() {
        try {
            // Initialize if not already initialized
            if (!this.client) {
                await this.initialize();
            }

            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(this.operatorAccount)
                .execute(this.client);

            return {
                status: 'healthy',
                network: this.client._network,
                operatorAccount: this.operatorAccount.toString(),
                operatorBalance: accountBalance.hbars.toString(),
                greenTokenId: this.greenTokenId,
                carbonTopicId: this.carbonTopicId,
                contractId: this.contractId
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = new HederaService();