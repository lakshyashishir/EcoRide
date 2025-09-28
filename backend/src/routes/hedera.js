const express = require('express');
const router = express.Router();
const hederaService = require('../services/hederaService');
const tokenService = require('../services/hedera/tokenService');
const consensusService = require('../services/hedera/consensusService');
const contractService = require('../services/hedera/contractService');
const mirrorNodeService = require('../services/hedera/mirrorNodeService');
const carbonCalculator = require('../services/carbonCalculator');
const { body, validationResult } = require('express-validator');

router.get('/health', async (req, res) => {
    try {
        const health = await hederaService.healthCheck();
        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced setup route using specialized services
router.post('/setup', async (req, res) => {
    try {
        const results = {};
        const errors = [];

        // Initialize all services
        await tokenService.initialize();
        await consensusService.initialize();

        // Create GREEN token if it doesn't exist
        try {
            if (!tokenService.getGreenTokenId()) {
                results.tokenId = await tokenService.createGreenToken();
                console.log(`✅ GREEN token created: ${results.tokenId}`);
            } else {
                results.tokenId = tokenService.getGreenTokenId();
                console.log(`✅ Using existing GREEN token: ${results.tokenId}`);
            }
        } catch (error) {
            errors.push(`Token creation failed: ${error.message}`);
        }

        // Create HCS topic if it doesn't exist
        try {
            if (!consensusService.getJourneyTopicId()) {
                results.topicId = await consensusService.createJourneyTopic();
                console.log(`✅ HCS topic created: ${results.topicId}`);
            } else {
                results.topicId = consensusService.getJourneyTopicId();
                console.log(`✅ Using existing HCS topic: ${results.topicId}`);
            }
        } catch (error) {
            errors.push(`Topic creation failed: ${error.message}`);
        }

        // Get token info
        if (results.tokenId) {
            try {
                results.tokenInfo = await tokenService.getTokenInfo();
            } catch (error) {
                console.warn(`Warning: Could not get token info: ${error.message}`);
            }
        }

        // Get topic info
        if (results.topicId) {
            try {
                results.topicInfo = await consensusService.getTopicInfo();
            } catch (error) {
                console.warn(`Warning: Could not get topic info: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            res.status(207).json({
                success: true,
                message: 'Hedera services setup completed with some errors',
                data: results,
                errors
            });
        } else {
            res.json({
                success: true,
                message: 'Hedera services setup completed successfully',
                data: results
            });
        }
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/journey',
    [
        body('journeyId').notEmpty().withMessage('Journey ID is required'),
        body('fromStation').notEmpty().withMessage('From station is required'),
        body('toStation').notEmpty().withMessage('To station is required'),
        body('distance').isNumeric({ min: 0.1 }).withMessage('Distance must be at least 0.1 km'),
        body('carbonSaved').isNumeric({ min: 1 }).withMessage('Carbon savings must be positive (from metro ticket)'),
        body('userAddress').notEmpty().withMessage('User wallet address is required'),
        body('journeyTimestamp').optional().isISO8601().withMessage('Invalid journey timestamp')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { journeyId, fromStation, toStation, distance, carbonSaved, userAddress, journeyTimestamp, qrHash } = req.body;

            // Calculate tokens earned based on carbon saved (carbon saved in grams, convert to kg and multiply by 10)
            const tokensEarned = Math.floor((carbonSaved / 1000) * 10);

            const journeyData = {
                journeyId,
                fromStation,
                toStation,
                distance,
                carbonSaved, // CO2 data from metro ticket (in grams)
                tokensEarned,
                userAddress,
                journeyTimestamp: journeyTimestamp || new Date().toISOString(),
                qrCodeHash: qrHash || `qr_${Date.now()}`
            };

            // Submit to HCS for immutable record
            const hcsResult = await consensusService.submitJourneyRecord(journeyData);

            // Use smart contract to record journey (non-blocking)
            let contractResult = null;
            try {
                contractResult = await contractService.recordJourney(journeyData);
                console.log(`✅ Smart contract recording succeeded`);
            } catch (contractError) {
                console.error(`❌ Smart contract recording failed: ${contractError.message}`);
                contractResult = { error: contractError.message, status: 'FAILED' };
                // Continue anyway - HCS recording succeeded and we'll mint tokens directly
            }

            // DIRECT TOKEN MINTING: Mint GREEN2 tokens directly to user
            // This is the primary token distribution method
            let tokenMintResult = null;
            try {
                const carbonSavedKg = carbonSaved / 1000; // Convert grams to kg
                tokenMintResult = await tokenService.mintTokensForCarbonSavings(carbonSavedKg, userAddress);
                console.log(`✅ Directly minted ${tokenMintResult.tokensMinted} GREEN2 tokens to ${userAddress}`);
            } catch (tokenError) {
                console.error(`❌ Direct token minting failed: ${tokenError.message}`);
                // Continue anyway - HCS recording still succeeded
            }

            res.json({
                success: true,
                message: 'Journey processed and rewards distributed',
                data: {
                    journey: journeyData,
                    hcs: hcsResult,
                    contract: contractResult,
                    tokenMinting: tokenMintResult
                }
            });

        } catch (error) {
            console.error('Journey processing error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

router.get('/transaction/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const transaction = await hederaService.getTransactionDetails(transactionId);

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/calculate',
    [
        body('fromStation').notEmpty().withMessage('From station is required'),
        body('toStation').notEmpty().withMessage('To station is required'),
        body('distance').optional().isInt({ min: 1 }).withMessage('Distance must be a positive integer'),
        body('alternativeMode').optional().isIn(['car', 'motorcycle', 'auto', 'bus']).withMessage('Invalid alternative transport mode')
    ],
    (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { fromStation, toStation, distance, alternativeMode } = req.body;

            const journeyData = {
                fromStation,
                toStation,
                distance: distance || carbonCalculator.getStationDistance(fromStation, toStation),
                alternativeMode: alternativeMode || 'car'
            };

            const carbonAnalysis = carbonCalculator.calculateCarbonSaved(journeyData.distance, journeyData.alternativeMode);
            const tokenRewards = carbonCalculator.calculateTokenReward(carbonAnalysis.carbonSaved);

            res.json({
                success: true,
                data: {
                    journey: journeyData,
                    carbonAnalysis,
                    tokenRewards
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// Merchant redemption route with transaction fees
router.post('/merchant/redeem',
    [
        body('userAddress').notEmpty().withMessage('User address is required'),
        body('merchantAddress').notEmpty().withMessage('Merchant address is required'),
        body('amount').isInt({ min: 1 }).withMessage('Redeem amount must be positive'),
        body('description').notEmpty().withMessage('Redemption description is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { userAddress, merchantAddress, amount, description } = req.body;

            const redemptionResult = await hederaService.processMerchantRedemption({
                userAddress,
                merchantAddress,
                amount,
                description
            });

            res.json({
                success: true,
                message: 'Merchant redemption processed successfully',
                data: redemptionResult
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            platform: 'EcoRide',
            version: '1.0.0',
            network: process.env.HEDERA_NETWORK || 'testnet',
            tokenSymbol: process.env.GREEN_TOKEN_SYMBOL || 'GREEN',
            tokenName: process.env.GREEN_TOKEN_NAME || 'GreenToken',
            carbonEmissionFactor: process.env.CARBON_EMISSION_FACTOR || 0.171,
            baseRewardMultiplier: process.env.BASE_REWARD_MULTIPLIER || 10,
            maxDailyRewards: process.env.MAX_DAILY_REWARDS || 1000,
            supportedTransportModes: ['car', 'motorcycle', 'auto', 'bus']
        }
    });
});

// Token Service Routes
router.get('/token/info', async (req, res) => {
    try {
        const tokenInfo = await tokenService.getTokenInfo();
        res.json({
            success: true,
            data: tokenInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Force create new token route
router.post('/token/create-new', async (req, res) => {
    try {
        // Force create new token regardless of existing one
        const newTokenId = await tokenService.createGreenToken(true);
        res.json({
            success: true,
            message: `Successfully created new GREEN token`,
            data: {
                tokenId: newTokenId,
                treasuryAccount: process.env.HEDERA_TREASURY_ACCOUNT_ID
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mint initial supply route
router.post('/token/mint-initial', async (req, res) => {
    try {
        const { amount = 1000000 } = req.body; // Default 1M tokens

        const result = await tokenService.mintInitialSupply(amount);
        res.json({
            success: true,
            message: `Successfully minted ${amount} GREEN tokens to treasury`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/token/balance/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const balance = await tokenService.getTokenBalance(accountId);
        const isAssociated = await tokenService.isTokenAssociated(accountId);

        res.json({
            success: true,
            data: {
                accountId,
                balance,
                tokenSymbol: process.env.GREEN_TOKEN_SYMBOL || 'GREEN',
                tokenId: tokenService.getGreenTokenId(),
                isAssociated
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get token association status
router.get('/token/association/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const isAssociated = await tokenService.isTokenAssociated(accountId);
        const tokenId = tokenService.getGreenTokenId();

        res.json({
            success: true,
            data: {
                accountId,
                tokenId,
                isAssociated,
                tokenSymbol: process.env.GREEN_TOKEN_SYMBOL || 'GREEN',
                message: isAssociated
                    ? 'Account is associated with GREEN token'
                    : 'Account must associate with GREEN token before receiving rewards'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Consensus Service Routes
router.get('/topic/info', async (req, res) => {
    try {
        const topicInfo = await consensusService.getTopicInfo();
        res.json({
            success: true,
            data: topicInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/topic/messages', async (req, res) => {
    try {
        const { limit = 10, order = 'desc' } = req.query;

        // Initialize the consensus service to load topic ID from environment
        await consensusService.initialize();
        const topicId = consensusService.getJourneyTopicId();

        if (!topicId) {
            return res.status(400).json({
                success: false,
                error: 'HCS topic not created yet'
            });
        }

        const messages = await mirrorNodeService.getTopicMessages(topicId, parseInt(limit), order);
        res.json({
            success: true,
            data: {
                topicId,
                messages,
                count: messages.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mirror Node Service Routes
router.get('/mirror/account/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const accountData = await mirrorNodeService.getAccountBalance(accountId);
        res.json({
            success: true,
            data: accountData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/mirror/transactions/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 25, order = 'desc', type } = req.query;

        const transactions = await mirrorNodeService.getAccountTransactions(
            accountId,
            parseInt(limit),
            order,
            type
        );

        res.json({
            success: true,
            data: {
                accountId,
                transactions,
                count: transactions.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/mirror/token-transfers/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 25 } = req.query;
        const tokenId = tokenService.getGreenTokenId();

        const transfers = await mirrorNodeService.getTokenTransfers(
            accountId,
            tokenId,
            parseInt(limit)
        );

        res.json({
            success: true,
            data: {
                accountId,
                tokenId,
                transfers,
                count: transfers.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analytics Routes
router.get('/analytics/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Initialize the consensus service to load topic ID from environment
        await consensusService.initialize();
        const topicId = consensusService.getJourneyTopicId();

        if (!topicId) {
            return res.status(400).json({
                success: false,
                error: 'HCS topic not created yet'
            });
        }

        const userStats = await mirrorNodeService.getUserJourneyStats(userId, topicId);
        res.json({
            success: true,
            data: userStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/analytics/system', async (req, res) => {
    try {
        // Initialize the consensus service to load topic ID from environment
        await consensusService.initialize();
        const topicId = consensusService.getJourneyTopicId();

        if (!topicId) {
            return res.status(400).json({
                success: false,
                error: 'HCS topic not created yet'
            });
        }

        const systemStats = await mirrorNodeService.getSystemJourneyStats(topicId);
        res.json({
            success: true,
            data: systemStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Contract information and debug routes
router.get('/contract/token-address', async (req, res) => {
    try {
        const contractTokenAddress = await contractService.getContractTokenAddress();
        const envTokenId = process.env.GREEN_TOKEN_ID;
        const contractId = contractService.getContractId();

        res.json({
            success: true,
            data: {
                contractId,
                contractTokenAddress,
                envTokenId,
                match: contractTokenAddress === envTokenId,
                message: contractTokenAddress === envTokenId
                    ? 'Contract and environment token addresses match'
                    : 'WARNING: Contract and environment token addresses do not match!'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;