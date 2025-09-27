const fetch = require('node-fetch');

class MirrorNodeService {
    constructor() {
        this.baseUrl = process.env.HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
        this.apiVersion = '/api/v1';
    }

    /**
     * Get transaction details by transaction ID
     */
    async getTransaction(transactionId) {
        try {
            const url = `${this.baseUrl}${this.apiVersion}/transactions/${transactionId}`;
            console.log(`Fetching transaction details from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatTransactionData(data);
        } catch (error) {
            console.error(`❌ Failed to get transaction ${transactionId}:`, error.message);
            throw new Error(`Transaction query failed: ${error.message}`);
        }
    }

    /**
     * Get account balance and token balances
     */
    async getAccountBalance(accountId) {
        try {
            const url = `${this.baseUrl}${this.apiVersion}/accounts/${accountId}`;
            console.log(`Fetching account balance from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatAccountData(data);
        } catch (error) {
            console.error(`❌ Failed to get account balance for ${accountId}:`, error.message);
            throw new Error(`Account balance query failed: ${error.message}`);
        }
    }
al
    /**
     * Get token information
     */
    async getTokenInfo(tokenId) {
        try {
            const url = `${this.baseUrl}${this.apiVersion}/tokens/${tokenId}`;
            console.log(`Fetching token info from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatTokenData(data);
        } catch (error) {
            console.error(`❌ Failed to get token info for ${tokenId}:`, error.message);
            throw new Error(`Token info query failed: ${error.message}`);
        }
    }

    /**
     * Get HCS topic messages
     */
    async getTopicMessages(topicId, limit = 10, order = 'desc') {
        try {
            const url = `${this.baseUrl}${this.apiVersion}/topics/${topicId}/messages?limit=${limit}&order=${order}`;
            console.log(`Fetching topic messages from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatTopicMessages(data.messages);
        } catch (error) {
            console.error(`❌ Failed to get topic messages for ${topicId}:`, error.message);
            throw new Error(`Topic messages query failed: ${error.message}`);
        }
    }

    /**
     * Get specific topic message by sequence number
     */
    async getTopicMessage(topicId, sequenceNumber) {
        try {
            const url = `${this.baseUrl}${this.apiVersion}/topics/${topicId}/messages/${sequenceNumber}`;
            console.log(`Fetching topic message from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return this.formatTopicMessage(data);
        } catch (error) {
            console.error(`❌ Failed to get topic message ${sequenceNumber} for ${topicId}:`, error.message);
            throw new Error(`Topic message query failed: ${error.message}`);
        }
    }

    /**
     * Get account transactions
     */
    async getAccountTransactions(accountId, limit = 25, order = 'desc', transactionType = null) {
        try {
            let url = `${this.baseUrl}${this.apiVersion}/transactions?account.id=${accountId}&limit=${limit}&order=${order}`;

            if (transactionType) {
                url += `&transactiontype=${transactionType}`;
            }

            console.log(`Fetching account transactions from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data.transactions.map(tx => this.formatTransactionData(tx));
        } catch (error) {
            console.error(`❌ Failed to get transactions for account ${accountId}:`, error.message);
            throw new Error(`Account transactions query failed: ${error.message}`);
        }
    }

    /**
     * Get token transfers for an account
     */
    async getTokenTransfers(accountId, tokenId = null, limit = 25) {
        try {
            let url = `${this.baseUrl}${this.apiVersion}/transactions?account.id=${accountId}&transactiontype=cryptotransfer&limit=${limit}`;

            if (tokenId) {
                url += `&token.id=${tokenId}`;
            }

            console.log(`Fetching token transfers from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Mirror Node API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data.transactions
                .filter(tx => tx.token_transfers && tx.token_transfers.length > 0)
                .map(tx => this.formatTokenTransferData(tx));
        } catch (error) {
            console.error(`❌ Failed to get token transfers for account ${accountId}:`, error.message);
            throw new Error(`Token transfers query failed: ${error.message}`);
        }
    }

    /**
     * Get user journey statistics from HCS messages
     */
    async getUserJourneyStats(userId, topicId) {
        try {
            // Get all messages from the topic
            const messages = await this.getTopicMessages(topicId, 1000, 'asc');

            // Filter messages for the specific user
            const userJourneys = messages
                .filter(msg => {
                    try {
                        const journeyData = JSON.parse(msg.message);
                        return journeyData.userId === userId;
                    } catch (e) {
                        return false;
                    }
                })
                .map(msg => {
                    const journeyData = JSON.parse(msg.message);
                    return {
                        ...journeyData,
                        consensusTimestamp: msg.consensusTimestamp,
                        sequenceNumber: msg.sequenceNumber
                    };
                });

            // Calculate statistics
            const stats = this.calculateJourneyStats(userJourneys);

            return {
                userId,
                totalJourneys: userJourneys.length,
                ...stats,
                recentJourneys: userJourneys.slice(-10) // Last 10 journeys
            };
        } catch (error) {
            console.error(`❌ Failed to get user journey stats for ${userId}:`, error.message);
            throw new Error(`User journey stats query failed: ${error.message}`);
        }
    }

    /**
     * Get system-wide journey statistics
     */
    async getSystemJourneyStats(topicId) {
        try {
            const messages = await this.getTopicMessages(topicId, 10000, 'asc');

            const allJourneys = messages
                .map(msg => {
                    try {
                        return JSON.parse(msg.message);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(journey => journey !== null);

            const stats = this.calculateJourneyStats(allJourneys);

            return {
                totalJourneys: allJourneys.length,
                uniqueUsers: new Set(allJourneys.map(j => j.userId)).size,
                ...stats,
                dailyBreakdown: this.calculateDailyBreakdown(allJourneys),
                popularRoutes: this.calculatePopularRoutes(allJourneys)
            };
        } catch (error) {
            console.error(`❌ Failed to get system journey stats:`, error.message);
            throw new Error(`System journey stats query failed: ${error.message}`);
        }
    }

    /**
     * Format transaction data from Mirror Node
     */
    formatTransactionData(transaction) {
        return {
            transactionId: transaction.transaction_id,
            consensusTimestamp: transaction.consensus_timestamp,
            transactionType: transaction.name,
            result: transaction.result,
            charged_tx_fee: transaction.charged_tx_fee,
            entity_id: transaction.entity_id,
            transfers: transaction.transfers || [],
            token_transfers: transaction.token_transfers || []
        };
    }

    /**
     * Format account data from Mirror Node
     */
    formatAccountData(account) {
        return {
            accountId: account.account,
            balance: {
                hbars: account.balance.balance,
                timestamp: account.balance.timestamp
            },
            tokens: account.balance.tokens || []
        };
    }

    /**
     * Format token data from Mirror Node
     */
    formatTokenData(token) {
        return {
            tokenId: token.token_id,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            totalSupply: token.total_supply,
            treasuryAccountId: token.treasury_account_id,
            created_timestamp: token.created_timestamp,
            modified_timestamp: token.modified_timestamp
        };
    }

    /**
     * Format topic messages from Mirror Node
     */
    formatTopicMessages(messages) {
        return messages.map(msg => this.formatTopicMessage(msg));
    }

    /**
     * Format single topic message
     */
    formatTopicMessage(message) {
        return {
            topicId: message.topic_id,
            sequenceNumber: message.sequence_number,
            consensusTimestamp: message.consensus_timestamp,
            message: Buffer.from(message.message, 'base64').toString('utf-8'),
            runningHash: message.running_hash,
            payerAccountId: message.payer_account_id
        };
    }

    /**
     * Format token transfer data
     */
    formatTokenTransferData(transaction) {
        return {
            transactionId: transaction.transaction_id,
            consensusTimestamp: transaction.consensus_timestamp,
            tokenTransfers: transaction.token_transfers.map(transfer => ({
                tokenId: transfer.token_id,
                accountId: transfer.account,
                amount: transfer.amount
            }))
        };
    }

    /**
     * Calculate journey statistics
     */
    calculateJourneyStats(journeys) {
        const totalCarbonSaved = journeys.reduce((sum, j) => sum + (j.carbonCalculation?.carbonSaved || 0), 0);
        const totalTokensEarned = journeys.reduce((sum, j) => sum + (j.rewards?.tokensEarned || 0), 0);
        const totalDistance = journeys.reduce((sum, j) => sum + (j.journey?.distance || 0), 0);

        return {
            totalCarbonSaved: Math.round(totalCarbonSaved * 100) / 100,
            totalTokensEarned: Math.round(totalTokensEarned * 100) / 100,
            totalDistance: Math.round(totalDistance * 100) / 100,
            averageCarbonPerJourney: journeys.length > 0 ? Math.round((totalCarbonSaved / journeys.length) * 100) / 100 : 0,
            averageDistancePerJourney: journeys.length > 0 ? Math.round((totalDistance / journeys.length) * 100) / 100 : 0
        };
    }

    /**
     * Calculate daily breakdown of journeys
     */
    calculateDailyBreakdown(journeys) {
        const daily = {};

        journeys.forEach(journey => {
            const date = journey.timestamp ? journey.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
            if (!daily[date]) {
                daily[date] = { count: 0, carbonSaved: 0, tokensEarned: 0 };
            }
            daily[date].count++;
            daily[date].carbonSaved += journey.carbonCalculation?.carbonSaved || 0;
            daily[date].tokensEarned += journey.rewards?.tokensEarned || 0;
        });

        return Object.entries(daily)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30); // Last 30 days
    }

    /**
     * Calculate popular routes
     */
    calculatePopularRoutes(journeys) {
        const routes = {};

        journeys.forEach(journey => {
            const route = `${journey.journey?.fromStation} → ${journey.journey?.toStation}`;
            if (!routes[route]) {
                routes[route] = { count: 0, totalCarbonSaved: 0 };
            }
            routes[route].count++;
            routes[route].totalCarbonSaved += journey.carbonCalculation?.carbonSaved || 0;
        });

        return Object.entries(routes)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 10) // Top 10 routes
            .map(([route, stats]) => ({ route, ...stats }));
    }
}

module.exports = new MirrorNodeService();