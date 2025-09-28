const express = require('express');
const { body, validationResult } = require('express-validator');
const FraudDetectionAgent = require('../agent/FraudDetectionAgent');

const router = express.Router();
const fraudAgent = new FraudDetectionAgent();

/**
 * @route POST /api/fraud-check
 * @desc Analyze journey for fraud indicators
 * @access Public (in production, should be authenticated)
 */
router.post('/fraud-check', [
    // Validation middleware
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('journeyData').isObject().withMessage('Journey data must be an object'),
    body('journeyData.distance').isNumeric().withMessage('Distance must be a number'),
    body('journeyData.carbonSaved').isNumeric().withMessage('Carbon saved must be a number'),
    body('journeyData.fromStation').notEmpty().withMessage('From station is required'),
    body('journeyData.toStation').notEmpty().withMessage('To station is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { accountId, journeyData } = req.body;

        console.log(`🔍 Fraud check requested for account: ${accountId}`);

        // Perform fraud analysis
        const analysis = await fraudAgent.analyzeJourney(accountId, journeyData);

        // Log the result for monitoring
        console.log(`📊 Fraud analysis result: ${analysis.riskLevel} risk, score ${analysis.fraudScore}`);

        // Return analysis result
        res.json({
            success: true,
            data: {
                accountId: analysis.accountId,
                fraudScore: analysis.fraudScore,
                riskLevel: analysis.riskLevel,
                approved: analysis.approved,
                timestamp: analysis.timestamp,
                summary: {
                    accountRisk: analysis.details.accountAnalysis.riskScore,
                    journeyRisk: analysis.details.journeyAnalysis.riskScore,
                    recommendations: analysis.details.recommendations
                },
                details: analysis.details
            }
        });

    } catch (error) {
        console.error('❌ Fraud check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Fraud analysis failed',
            message: error.message
        });
    }
});

/**
 * @route GET /api/fraud-check/stats
 * @desc Get fraud detection agent statistics
 * @access Public
 */
router.get('/fraud-check/stats', (req, res) => {
    try {
        const stats = fraudAgent.getAgentStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Failed to get agent stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve agent statistics'
        });
    }
});

/**
 * @route POST /api/fraud-check/validate-account
 * @desc Quick account validation for basic checks
 * @access Public
 */
router.post('/fraud-check/validate-account', [
    body('accountId').notEmpty().withMessage('Account ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { accountId } = req.body;

        console.log(`👤 Account validation requested for: ${accountId}`);

        // Perform account analysis only
        const accountAnalysis = await fraudAgent.analyzeAccount(accountId);

        res.json({
            success: true,
            data: {
                accountId,
                riskScore: accountAnalysis.riskScore,
                riskLevel: fraudAgent.getRiskLevel(accountAnalysis.riskScore),
                accountAge: accountAnalysis.accountAge,
                factors: accountAnalysis.factors,
                valid: accountAnalysis.riskScore < fraudAgent.riskThresholds.HIGH
            }
        });

    } catch (error) {
        console.error('❌ Account validation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Account validation failed',
            message: error.message
        });
    }
});

/**
 * @route GET /api/fraud-check/health
 * @desc Health check for fraud detection service
 * @access Public
 */
router.get('/fraud-check/health', (req, res) => {
    try {
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            agent: 'EcoRide Anti-Fraud Agent',
            version: '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;