const { HederaAgentKit } = require('hedera-agent-kit');
const { AccountId, Client } = require('@hashgraph/sdk');

class FraudDetectionAgent {
    constructor() {
        this.client = null;
        this.agentKit = null;
        this.riskThresholds = {
            LOW: 25,
            MEDIUM: 60,
            HIGH: 85
        };
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize Hedera client for testnet
            this.client = Client.forTestnet();

            // Set operator only if real credentials are provided
            if (process.env.HEDERA_OPERATOR_PRIVATE_KEY &&
                process.env.HEDERA_OPERATOR_ACCOUNT_ID &&
                !process.env.HEDERA_OPERATOR_ACCOUNT_ID.includes('YOUR_ACCOUNT_ID')) {

                this.client.setOperator(
                    AccountId.fromString(process.env.HEDERA_OPERATOR_ACCOUNT_ID),
                    process.env.HEDERA_OPERATOR_PRIVATE_KEY
                );

                // Initialize Hedera Agent Kit
                this.agentKit = new HederaAgentKit(
                    process.env.HEDERA_OPERATOR_PRIVATE_KEY,
                    process.env.HEDERA_OPERATOR_ACCOUNT_ID,
                    "testnet"
                );
            } else {
                console.log("Running in demo mode - using simulated data");
                this.agentKit = null; // Will use mock data
            }

            console.log("Fraud Detection Agent initialized successfully");
        } catch (error) {
            console.error("❌ Failed to initialize Fraud Detection Agent:", error);
            console.log("Falling back to demo mode");
            this.agentKit = null;
        }
    }

    /**
     * Main fraud detection function
     * @param {string} accountId - Hedera account ID to analyze
     * @param {Object} journeyData - Journey information
     * @returns {Object} Fraud analysis result
     */
    async analyzeJourney(accountId, journeyData) {
        console.log(`🔍 Analyzing journey for account: ${accountId}`);

        const fraudScore = await this.calculateFraudScore(accountId, journeyData);
        const riskLevel = this.getRiskLevel(fraudScore);
        const approved = fraudScore < this.riskThresholds.HIGH;

        const analysis = {
            accountId,
            fraudScore,
            riskLevel,
            approved,
            timestamp: new Date().toISOString(),
            details: {
                accountAnalysis: await this.analyzeAccount(accountId),
                journeyAnalysis: this.analyzeJourneyData(journeyData),
                recommendations: this.getRecommendations(fraudScore, riskLevel)
            }
        };

        console.log(`📊 Fraud analysis complete: Score ${fraudScore}, Risk ${riskLevel}, Approved ${approved}`);
        return analysis;
    }

    /**
     * Calculate fraud score based on multiple factors
     */
    async calculateFraudScore(accountId, journeyData) {
        let score = 0;

        // Account-based scoring
        const accountAnalysis = await this.analyzeAccount(accountId);
        score += accountAnalysis.riskScore;

        // Journey-based scoring
        const journeyAnalysis = this.analyzeJourneyData(journeyData);
        score += journeyAnalysis.riskScore;

        // Ensure score is between 0-100
        return Math.min(Math.max(score, 0), 100);
    }

    /**
     * Analyze Hedera account for suspicious patterns
     */
    async analyzeAccount(accountId) {
        const analysis = {
            riskScore: 0,
            factors: [],
            accountAge: 0,
            transactionCount: 0,
            tokenAssociations: 0
        };

        try {
            if (this.agentKit) {
                // Real Hedera analysis
                const accountInfo = await this.agentKit.getAccountInfo(accountId);

                if (!accountInfo) {
                    analysis.riskScore += 30;
                    analysis.factors.push("Account not found or invalid");
                    return analysis;
                }

                const accountAge = this.calculateAccountAge(accountInfo.created);
                analysis.accountAge = accountAge;

                if (accountAge < 7) {
                    analysis.riskScore += 25;
                    analysis.factors.push("Very new account (< 7 days)");
                } else if (accountAge < 30) {
                    analysis.riskScore += 15;
                    analysis.factors.push("New account (< 30 days)");
                }

                const balance = await this.agentKit.getAccountBalance(accountId);
                if (balance && balance.hbars < 1) {
                    analysis.riskScore += 20;
                    analysis.factors.push("Low HBAR balance (< 1 HBAR)");
                }

                if (accountInfo.tokenRelationships) {
                    analysis.tokenAssociations = accountInfo.tokenRelationships.length;
                    if (analysis.tokenAssociations === 0) {
                        analysis.riskScore += 15;
                        analysis.factors.push("No token associations");
                    }
                }
            } else {
                // Demo mode - simulate account analysis
                const randomAge = Math.floor(Math.random() * 365) + 1;
                analysis.accountAge = randomAge;

                if (randomAge < 30) {
                    analysis.riskScore += Math.random() > 0.5 ? 15 : 0;
                    if (analysis.riskScore > 0) {
                        analysis.factors.push("Simulated new account risk");
                    }
                }

                // Random balance risk
                if (Math.random() > 0.7) {
                    analysis.riskScore += 20;
                    analysis.factors.push("Simulated low balance risk");
                }
            }

        } catch (error) {
            console.error(`Error analyzing account ${accountId}:`, error);
            analysis.riskScore += 40;
            analysis.factors.push("Account analysis failed");
        }

        return analysis;
    }

    /**
     * Analyze journey data for suspicious patterns
     */
    analyzeJourneyData(journeyData) {
        const analysis = {
            riskScore: 0,
            factors: []
        };

        const { distance, carbonSaved, fromStation, toStation, journeyTime } = journeyData;

        // Distance validation
        if (distance < 100) { // Less than 100 meters
            analysis.riskScore += 30;
            analysis.factors.push("Suspiciously short distance");
        } else if (distance > 50000) { // More than 50km
            analysis.riskScore += 25;
            analysis.factors.push("Unusually long distance");
        }

        // Carbon savings validation
        const expectedCarbon = distance * 0.15; // Rough estimate: 150g CO2 per km saved
        const carbonRatio = carbonSaved / expectedCarbon;

        if (carbonRatio > 2.0) { // More than 2x expected
            analysis.riskScore += 20;
            analysis.factors.push("Carbon savings too high for distance");
        } else if (carbonRatio < 0.5) { // Less than half expected
            analysis.riskScore += 10;
            analysis.factors.push("Carbon savings too low for distance");
        }

        // Journey time validation
        if (journeyTime) {
            const expectedTime = distance / 500; // Rough estimate: 30 km/h average speed
            const actualTime = (Date.now() - new Date(journeyTime).getTime()) / (1000 * 60); // minutes

            if (actualTime < expectedTime * 0.5) { // Too fast
                analysis.riskScore += 25;
                analysis.factors.push("Journey completed too quickly");
            }
        }

        // Station validation
        if (fromStation === toStation) {
            analysis.riskScore += 40;
            analysis.factors.push("Same origin and destination station");
        }

        // Check for known suspicious patterns
        if (distance === 50000 && carbonSaved > 7000) { // Max distance with high carbon
            analysis.riskScore += 35;
            analysis.factors.push("Suspicious maximum reward pattern");
        }

        return analysis;
    }

    /**
     * Calculate account age in days
     */
    calculateAccountAge(createdTimestamp) {
        if (!createdTimestamp) return 0;
        const created = new Date(createdTimestamp);
        const now = new Date();
        return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    }

    /**
     * Get risk level based on fraud score
     */
    getRiskLevel(score) {
        if (score < this.riskThresholds.LOW) return 'LOW';
        if (score < this.riskThresholds.MEDIUM) return 'MEDIUM';
        if (score < this.riskThresholds.HIGH) return 'HIGH';
        return 'CRITICAL';
    }

    /**
     * Get recommendations based on fraud analysis
     */
    getRecommendations(score, riskLevel) {
        const recommendations = [];

        switch (riskLevel) {
            case 'LOW':
                recommendations.push("✅ Journey approved - Low risk detected");
                break;
            case 'MEDIUM':
                recommendations.push("⚠️ Manual review recommended");
                recommendations.push("Consider additional verification");
                break;
            case 'HIGH':
                recommendations.push("🚨 High risk - Manual approval required");
                recommendations.push("Investigate account history");
                break;
            case 'CRITICAL':
                recommendations.push("❌ Reject transaction");
                recommendations.push("Potential fraud detected");
                recommendations.push("Block account if pattern continues");
                break;
        }

        return recommendations;
    }

    /**
     * Get fraud statistics for monitoring
     */
    getAgentStats() {
        return {
            agentName: "EcoRide Anti-Fraud Agent",
            version: "1.0.0",
            network: "hedera-testnet",
            thresholds: this.riskThresholds,
            capabilities: [
                "Account age analysis",
                "Transaction history review",
                "Journey pattern validation",
                "Real-time fraud scoring"
            ]
        };
    }
}

module.exports = FraudDetectionAgent;