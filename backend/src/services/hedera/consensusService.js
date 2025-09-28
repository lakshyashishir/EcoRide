const {
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicInfoQuery,
    Hbar
} = require('@hashgraph/sdk');
const { hederaConfig } = require('../../config/hedera');

class ConsensusService {
    constructor() {
        this.journeyTopicId = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            await hederaConfig.initialize();

            // Load existing topic ID if available
            if (process.env.HCS_TOPIC_ID) {
                this.journeyTopicId = process.env.HCS_TOPIC_ID;
                console.log(`✅ Using existing HCS topic: ${this.journeyTopicId}`);
            }

            this.isInitialized = true;
        }
    }

    /**
     * Create HCS topic for journey record consensus
     */
    async createJourneyTopic() {
        await this.initialize();

        if (this.journeyTopicId) {
            console.log(`HCS topic already exists: ${this.journeyTopicId}`);
            return this.journeyTopicId;
        }

        try {
            const client = hederaConfig.getClient();
            const operatorAccount = hederaConfig.getOperatorAccount();

            console.log('Creating HCS topic for EcoRide journey records...');

            const topicCreateTx = new TopicCreateTransaction()
                .setTopicMemo('EcoRide Journey Records - Immutable carbon savings tracking for Delhi Metro commuters')
                .setSubmitKey(operatorAccount.privateKey)
                .setAdminKey(operatorAccount.privateKey)
                .setMaxTransactionFee(new Hbar(5))
                .freezeWith(client);

            const topicCreateSign = await topicCreateTx.sign(operatorAccount.privateKey);
            const topicCreateSubmit = await topicCreateSign.execute(client);
            const topicCreateRx = await topicCreateSubmit.getReceipt(client);

            this.journeyTopicId = topicCreateRx.topicId.toString();

            console.log(`✅ HCS topic created successfully: ${this.journeyTopicId}`);
            console.log(`Transaction ID: ${topicCreateSubmit.transactionId}`);

            return this.journeyTopicId;
        } catch (error) {
            console.error('❌ Failed to create HCS topic:', error.message);
            throw new Error(`Topic creation failed: ${error.message}`);
        }
    }

    /**
     * Submit journey record to HCS for immutable storage
     */
    async submitJourneyRecord(journeyData) {
        await this.initialize();

        if (!this.journeyTopicId) {
            throw new Error('HCS topic not created yet. Call createJourneyTopic() first.');
        }

        try {
            const client = hederaConfig.getClient();
            const operatorAccount = hederaConfig.getOperatorAccount();

            // Validate journey data
            this.validateJourneyData(journeyData);

            // Prepare COMPACT consensus message for HCS size limits
            const consensusMessage = {
                v: '1.0',
                ts: new Date().toISOString(),
                jid: journeyData.journeyId,
                uid: journeyData.userAddress || 'unknown',
                qr: journeyData.qrCodeHash,
                journey: {
                    from: journeyData.fromStation,
                    to: journeyData.toStation,
                    dist: journeyData.distance,
                    time: journeyData.journeyTimestamp
                },
                carbon: {
                    saved: journeyData.carbonSaved,
                    kg: (journeyData.carbonSaved / 1000).toFixed(3)
                },
                rewards: {
                    tokens: journeyData.tokensEarned,
                    symbol: 'GREEN2',
                    tokenId: process.env.GREEN_TOKEN_ID
                },
                verified: true
            };

            const messageString = JSON.stringify(consensusMessage);
            console.log(`Submitting journey record to HCS (${messageString.length} bytes)`);

            const topicMessageTx = new TopicMessageSubmitTransaction()
                .setTopicId(this.journeyTopicId)
                .setMessage(messageString)
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(client);

            const topicMessageSign = await topicMessageTx.sign(operatorAccount.privateKey);
            const topicMessageSubmit = await topicMessageSign.execute(client);
            const topicMessageRx = await topicMessageSubmit.getReceipt(client);

            const sequenceNumber = topicMessageRx.topicSequenceNumber.toString();
            const transactionId = topicMessageSubmit.transactionId.toString();

            console.log(`✅ Journey record submitted to HCS:`);
            console.log(`- Topic ID: ${this.journeyTopicId}`);
            console.log(`- Sequence Number: ${sequenceNumber}`);
            console.log(`- Transaction ID: ${transactionId}`);

            return {
                topicId: this.journeyTopicId,
                sequenceNumber,
                transactionId,
                consensusTimestamp: topicMessageRx.topicRunningHash,
                messageSize: messageString.length,
                journeyId: journeyData.journeyId
            };
        } catch (error) {
            console.error('❌ Failed to submit journey record to HCS:', error.message);
            throw new Error(`Journey record submission failed: ${error.message}`);
        }
    }

    /**
     * Submit bulk journey records for batch processing
     */
    async submitBulkJourneyRecords(journeyDataArray) {
        const results = [];

        for (const journeyData of journeyDataArray) {
            try {
                const result = await this.submitJourneyRecord(journeyData);
                results.push({ success: true, result });
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    journeyId: journeyData.journeyId
                });
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`Bulk submission completed: ${successful} successful, ${failed} failed`);

        return {
            totalSubmitted: journeyDataArray.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Get topic information
     */
    async getTopicInfo() {
        await this.initialize();

        if (!this.journeyTopicId) {
            throw new Error('HCS topic not created yet');
        }


        try {
            const client = hederaConfig.getClient();

            const topicInfo = await new TopicInfoQuery()
                .setTopicId(this.journeyTopicId)
                .execute(client);

            return {
                topicId: topicInfo.topicId.toString(),
                topicMemo: topicInfo.topicMemo,
                adminKey: topicInfo.adminKey ? topicInfo.adminKey.toString() : null,
                submitKey: topicInfo.submitKey ? topicInfo.submitKey.toString() : null,
                sequenceNumber: topicInfo.sequenceNumber.toString(),
                runningHash: topicInfo.runningHash.toString()
            };
        } catch (error) {
            console.error('❌ Failed to get topic info:', error.message);
            throw new Error(`Topic info query failed: ${error.message}`);
        }
    }

    /**
     * Validate journey data before submission
     */
    validateJourneyData(journeyData) {
        const requiredFields = [
            'journeyId',
            'fromStation',
            'toStation',
            'distance',
            'carbonSaved',
            'tokensEarned'
        ];

        for (const field of requiredFields) {
            if (!journeyData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate data types and ranges
        if (typeof journeyData.distance !== 'number' || journeyData.distance <= 0) {
            throw new Error('Distance must be a positive number');
        }

        if (typeof journeyData.carbonSaved !== 'number' || journeyData.carbonSaved < 0) {
            throw new Error('Carbon saved must be a non-negative number');
        }

        if (typeof journeyData.tokensEarned !== 'number' || journeyData.tokensEarned < 0) {
            throw new Error('Tokens earned must be a non-negative number');
        }

        // Validate journey ID format
        if (!/^[a-zA-Z0-9\-_]+$/.test(journeyData.journeyId)) {
            throw new Error('Journey ID contains invalid characters');
        }
    }

    /**
     * Create journey hash for preventing duplicates
     */
    createJourneyHash(journeyData) {
        const crypto = require('crypto');
        const hashInput = `${journeyData.qrCodeHash}_${journeyData.fromStation}_${journeyData.toStation}_${journeyData.timestamp}`;
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }

    /**
     * Get the current topic ID
     */
    getJourneyTopicId() {
        return this.journeyTopicId;
    }

    /**
     * Set topic ID (for loading existing topics)
     */
    setJourneyTopicId(topicId) {
        this.journeyTopicId = topicId;
    }
}

module.exports = new ConsensusService();