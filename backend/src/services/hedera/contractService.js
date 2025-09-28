const {
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    Hbar,
    AccountId
} = require('@hashgraph/sdk');
const { hederaConfig } = require('../../config/hedera');
const { createHash } = require('crypto');

class ContractService {
    constructor() {
        this.contractId = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            await hederaConfig.initialize();

            if (process.env.GREEN_REWARDS_CONTRACT_ID) {
                this.contractId = process.env.GREEN_REWARDS_CONTRACT_ID;
                console.log(`✅ Using GREEN Rewards contract: ${this.contractId}`);
            }

            this.isInitialized = true;
        }
    }

    /**
     * Record journey via smart contract - this actually mints tokens!
     */
    async recordJourney(journeyData) {
        await this.initialize();

        if (!this.contractId) {
            throw new Error('Contract not deployed yet');
        }

        try {
            const client = hederaConfig.getClient();
            const operatorAccount = hederaConfig.getOperatorAccount();

            // Generate QR hash for duplicate prevention
            const qrHash = this.generateQRHash(journeyData.qrCodeHash || journeyData.journeyId);

            // Convert journey timestamp to Unix timestamp
            const journeyTimestamp = Math.floor(new Date(journeyData.journeyTimestamp).getTime() / 1000);

            // Convert Hedera account ID to EVM address
            const userAccountId = AccountId.fromString(journeyData.userAddress);
            const userEvmAddress = userAccountId.toSolidityAddress();

            console.log(`Recording journey via smart contract:`);
            console.log(`- Journey ID: ${journeyData.journeyId}`);
            console.log(`- User: ${journeyData.userAddress}`);
            console.log(`- Route: ${journeyData.fromStation} → ${journeyData.toStation}`);
            console.log(`- Distance: ${journeyData.distance}km`);
            console.log(`- Carbon Saved: ${journeyData.carbonSaved}g`);
            console.log(`- QR Hash: ${qrHash}`);

            // Call smart contract recordJourney function
            const contractExecuteTx = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(1000000)
                .setFunction(
                    'recordJourney',
                    new ContractFunctionParameters()
                        .addString(journeyData.journeyId)
                        .addString(journeyData.fromStation)
                        .addString(journeyData.toStation)
                        .addUint256(Math.round(journeyData.distance * 1000)) // Convert km to meters
                        .addUint256(journeyData.carbonSaved) // grams
                        .addAddress(userEvmAddress)
                        .addUint256(journeyTimestamp)
                        .addBytes32(qrHash)
                )
                .setMaxTransactionFee(new Hbar(5))
                .freezeWith(client);

            const contractExecuteSign = await contractExecuteTx.sign(operatorAccount.privateKey);
            const contractExecuteSubmit = await contractExecuteSign.execute(client);
            const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);

            console.log(`✅ Journey recorded in smart contract!`);
            console.log(`- Transaction ID: ${contractExecuteSubmit.transactionId}`);
            console.log(`- Status: ${contractExecuteRx.status}`);

            // Calculate tokens that should have been minted
            const tokensEarned = Math.floor((journeyData.carbonSaved / 1000) * 10 * 100); // Contract uses 2 decimals

            return {
                transactionId: contractExecuteSubmit.transactionId.toString(),
                contractId: this.contractId,
                status: contractExecuteRx.status.toString(),
                tokensEarned: tokensEarned / 100, // Convert back to display format
                userAddress: journeyData.userAddress,
                journeyId: journeyData.journeyId,
                qrHash: qrHash
            };
        } catch (error) {
            console.error('❌ Failed to record journey in smart contract:', error.message);
            throw new Error(`Contract execution failed: ${error.message}`);
        }
    }

    /**
     * Get user statistics from smart contract
     */
    async getUserStats(userAddress) {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();

            const contractCallTx = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    'getUserStats',
                    new ContractFunctionParameters().addAddress(userAddress)
                )
                .setMaxQueryPayment(new Hbar(1));

            const contractCallResult = await contractCallTx.execute(client);

            const carbonSaved = contractCallResult.getUint256(0);
            const tokensEarned = contractCallResult.getUint256(1);
            const journeyCount = contractCallResult.getUint256(2);
            const lastJourney = contractCallResult.getUint256(3);

            return {
                carbonSaved: carbonSaved.toString(),
                tokensEarned: (tokensEarned.toNumber() / 100).toString(), // Convert from contract decimals
                journeyCount: journeyCount.toString(),
                lastJourney: new Date(lastJourney.toNumber() * 1000).toISOString()
            };
        } catch (error) {
            console.error('❌ Failed to get user stats:', error.message);
            throw new Error(`Contract query failed: ${error.message}`);
        }
    }

    /**
     * Get global platform statistics
     */
    async getGlobalStats() {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();

            const contractCallTx = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction('getGlobalStats')
                .setMaxQueryPayment(new Hbar(1));

            const contractCallResult = await contractCallTx.execute(client);

            const carbonSaved = contractCallResult.getUint256(0);
            const tokensDistributed = contractCallResult.getUint256(1);
            const userCount = contractCallResult.getUint256(2);
            const journeyCount = contractCallResult.getUint256(3);

            return {
                globalCarbonSaved: carbonSaved.toString(),
                globalTokensDistributed: (tokensDistributed.toNumber() / 100).toString(),
                totalUsers: userCount.toString(),
                totalJourneys: journeyCount.toString()
            };
        } catch (error) {
            console.error('❌ Failed to get global stats:', error.message);
            throw new Error(`Contract query failed: ${error.message}`);
        }
    }

    /**
     * Process merchant redemption with fees
     */
    async processMerchantRedemption(userAddress, merchantAddress, amount, description) {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();
            const operatorAccount = hederaConfig.getOperatorAccount();

            // Convert amount to contract format (2 decimals)
            const contractAmount = Math.round(amount * 100);

            const contractExecuteTx = new ContractExecuteTransaction()
                .setContractId(this.contractId)
                .setGas(800000)
                .setFunction(
                    'processMerchantRedemption',
                    new ContractFunctionParameters()
                        .addAddress(userAddress)
                        .addAddress(merchantAddress)
                        .addUint256(contractAmount)
                        .addString(description)
                )
                .setMaxTransactionFee(new Hbar(3))
                .freezeWith(client);

            const contractExecuteSign = await contractExecuteTx.sign(operatorAccount.privateKey);
            const contractExecuteSubmit = await contractExecuteSign.execute(client);
            const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);

            console.log(`✅ Merchant redemption processed via smart contract`);
            console.log(`- Transaction ID: ${contractExecuteSubmit.transactionId}`);

            return {
                transactionId: contractExecuteSubmit.transactionId.toString(),
                status: contractExecuteRx.status.toString(),
                amount: amount,
                fee: (amount * 0.02).toFixed(2), // 2% fee
                description: description
            };
        } catch (error) {
            console.error('❌ Failed to process merchant redemption:', error.message);
            throw new Error(`Merchant redemption failed: ${error.message}`);
        }
    }

    /**
     * Generate QR hash for duplicate prevention
     */
    generateQRHash(qrData) {
        const hash = createHash('sha256').update(qrData).digest();
        return hash; // Return raw bytes, not hex string
    }

    /**
     * Get daily reward status for user
     */
    async getDailyRewardStatus(userAddress) {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();

            const contractCallTx = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction(
                    'getDailyRewardStatus',
                    new ContractFunctionParameters().addAddress(userAddress)
                )
                .setMaxQueryPayment(new Hbar(1));

            const contractCallResult = await contractCallTx.execute(client);

            const remainingRewards = contractCallResult.getUint256(0);
            const lastRewardDay = contractCallResult.getUint256(1);

            return {
                remainingRewards: (remainingRewards.toNumber() / 100).toString(),
                lastRewardDay: lastRewardDay.toString(),
                maxDailyRewards: '1000' // Contract constant
            };
        } catch (error) {
            console.error('❌ Failed to get daily reward status:', error.message);
            throw new Error(`Daily reward query failed: ${error.message}`);
        }
    }

    async getContractTokenAddress() {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();

            const contractCallTx = new ContractCallQuery()
                .setContractId(this.contractId)
                .setGas(100000)
                .setFunction('greenTokenAddress')
                .setMaxQueryPayment(new Hbar(1));

            const contractCallResult = await contractCallTx.execute(client);
            const tokenAddress = contractCallResult.getAddress(0);

            return tokenAddress;
        } catch (error) {
            console.error('❌ Failed to get contract token address:', error.message);
            throw new Error(`Contract token address query failed: ${error.message}`);
        }
    }

    getContractId() {
        return this.contractId;
    }
}

module.exports = new ContractService();