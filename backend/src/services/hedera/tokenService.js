const {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    TransferTransaction,
    AccountBalanceQuery,
    TokenAssociateTransaction,
    TokenInfoQuery,
    Hbar
} = require('@hashgraph/sdk');
const { hederaConfig } = require('../../config/hedera');

class TokenService {
    constructor() {
        this.greenTokenId = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!this.isInitialized) {
            await hederaConfig.initialize();

            // Load existing token ID if available
            if (process.env.GREEN_TOKEN_ID) {
                this.greenTokenId = process.env.GREEN_TOKEN_ID;
                console.log(`✅ Using existing GREEN token: ${this.greenTokenId}`);
            } else {
                // Clear any cached token ID for fresh creation
                this.greenTokenId = null;
                console.log(`🔄 No existing token found, ready to create new token`);
            }

            this.isInitialized = true;
        }
    }

    /**
     * Create the GreenToken using HTS with proper metadata
     */
    async createGreenToken(forceCreate = false) {
        await this.initialize();

        if (this.greenTokenId && !forceCreate) {
            console.log(`GREEN token already exists: ${this.greenTokenId}`);
            return this.greenTokenId;
        }

        if (forceCreate) {
            console.log(`🔄 Force creating new GREEN token...`);
            this.greenTokenId = null; // Clear existing token ID
        }

        try {
            const client = hederaConfig.getClient();
            const treasuryAccount = hederaConfig.getTreasuryAccount();

            const tokenName = process.env.GREEN_TOKEN_NAME || 'GreenToken';
            const tokenSymbol = process.env.GREEN_TOKEN_SYMBOL || 'GREEN';
            const decimals = parseInt(process.env.GREEN_TOKEN_DECIMALS) || 2;
            const initialSupply = 0;

            console.log(`Creating GREEN token with:`);
            console.log(`- Name: ${tokenName}`);
            console.log(`- Symbol: ${tokenSymbol}`);
            console.log(`- Decimals: ${decimals}`);
            console.log(`- Initial Supply: ${initialSupply}`);

            const tokenCreateTx = new TokenCreateTransaction()
                .setTokenName(tokenName)
                .setTokenSymbol(tokenSymbol)
                .setTokenType(TokenType.FungibleCommon)
                .setDecimals(decimals)
                .setInitialSupply(0)
                .setSupplyType(TokenSupplyType.Infinite)
                .setTreasuryAccountId(treasuryAccount.accountId)
                .setSupplyKey(treasuryAccount.privateKey)
                .setAdminKey(treasuryAccount.privateKey)
                .setFreezeDefault(false)
                .setTokenMemo('EcoRide Carbon Savings Token - Rewards for sustainable metro commuting')
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(client);

            const tokenCreateSign = await tokenCreateTx.sign(treasuryAccount.privateKey);
            const tokenCreateSubmit = await tokenCreateSign.execute(client);
            const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);

            this.greenTokenId = tokenCreateRx.tokenId.toString();

            console.log(`✅ GREEN Token created successfully: ${this.greenTokenId}`);
            console.log(`Transaction ID: ${tokenCreateSubmit.transactionId}`);

            return this.greenTokenId;
        } catch (error) {
            console.error('❌ Failed to create GREEN Token:', error.message);
            throw new Error(`Token creation failed: ${error.message}`);
        }
    }

    /**
     * Check if account is associated with GREEN token
     */
    async isTokenAssociated(accountId) {
        await this.initialize();

        if (!this.greenTokenId) {
            return false;
        }

        try {
            const client = hederaConfig.getClient();

            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(accountId)
                .execute(client);

            // accountBalance.tokens is a Map, so we need to use .get() method
            const tokenBalance = accountBalance.tokens.get(this.greenTokenId);
            return tokenBalance !== null && tokenBalance !== undefined;
        } catch (error) {
            console.error(`❌ Failed to check token association for ${accountId}:`, error.message);
            return false;
        }
    }

    /**
     * Mint GREEN tokens based on carbon savings
     * Formula: tokens = carbonSaved(kg) * 10
     */
    async mintTokensForCarbonSavings(carbonSavedKg, recipientAccountId) {
        await this.initialize();

        if (!this.greenTokenId) {
            throw new Error('GREEN token not created yet. Call createGreenToken() first.');
        }

        try {
            const client = hederaConfig.getClient();
            const treasuryAccount = hederaConfig.getTreasuryAccount();

            // Check if recipient account is associated with the token
            const isAssociated = await this.isTokenAssociated(recipientAccountId);
            if (!isAssociated) {
                throw new Error(`Account ${recipientAccountId} is not associated with GREEN token ${this.greenTokenId}. The user must associate the token in their wallet before receiving rewards.`);
            }

            // Calculate tokens to mint (carbon saved * 10)
            const baseMultiplier = parseInt(process.env.BASE_REWARD_MULTIPLIER) || 10;
            const decimals = parseInt(process.env.GREEN_TOKEN_DECIMALS) || 2;
            const tokensToMint = Math.floor(carbonSavedKg * baseMultiplier * Math.pow(10, decimals));

            if (tokensToMint <= 0) {
                throw new Error('Invalid carbon savings amount - must be positive');
            }

            console.log(`Minting ${tokensToMint / Math.pow(10, decimals)} GREEN tokens for ${carbonSavedKg}kg carbon saved`);

            // Mint tokens to treasury first
            const tokenMintTx = new TokenMintTransaction()
                .setTokenId(this.greenTokenId)
                .setAmount(tokensToMint)
                .setMaxTransactionFee(new Hbar(5))
                .freezeWith(client);

            const tokenMintSign = await tokenMintTx.sign(treasuryAccount.privateKey);
            const tokenMintSubmit = await tokenMintSign.execute(client);
            const tokenMintRx = await tokenMintSubmit.getReceipt(client);

            console.log(`✅ Minted ${tokensToMint / Math.pow(10, decimals)} GREEN tokens`);
            console.log(`Mint Transaction ID: ${tokenMintSubmit.transactionId}`);

            // Transfer tokens to recipient
            const transferResult = await this.transferTokens(
                treasuryAccount.accountId,
                recipientAccountId,
                tokensToMint
            );

            return {
                mintTransactionId: tokenMintSubmit.transactionId.toString(),
                transferTransactionId: transferResult.transactionId,
                tokensMinted: tokensToMint / Math.pow(10, decimals),
                carbonSaved: carbonSavedKg,
                recipientAccount: recipientAccountId.toString()
            };
        } catch (error) {
            console.error('❌ Failed to mint GREEN tokens:', error.message);
            throw new Error(`Token minting failed: ${error.message}`);
        }
    }

    /**
     * Transfer GREEN tokens between accounts
     */
    async transferTokens(fromAccountId, toAccountId, amount) {
        await this.initialize();

        try {
            const client = hederaConfig.getClient();
            const treasuryAccount = hederaConfig.getTreasuryAccount();

            const transferTx = new TransferTransaction()
                .addTokenTransfer(this.greenTokenId, fromAccountId, -amount)
                .addTokenTransfer(this.greenTokenId, toAccountId, amount)
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(client);

            const transferSign = await transferTx.sign(treasuryAccount.privateKey);
            const transferSubmit = await transferSign.execute(client);
            const transferRx = await transferSubmit.getReceipt(client);

            console.log(`✅ Transferred ${amount} GREEN tokens from ${fromAccountId} to ${toAccountId}`);
            console.log(`Transfer Transaction ID: ${transferSubmit.transactionId}`);

            return {
                transactionId: transferSubmit.transactionId.toString(),
                status: transferRx.status.toString()
            };
        } catch (error) {
            console.error('❌ Failed to transfer GREEN tokens:', error.message);
            throw new Error(`Token transfer failed: ${error.message}`);
        }
    }

    /**
     * Get GREEN token balance for an account
     */
    async getTokenBalance(accountId) {
        await this.initialize();

        if (!this.greenTokenId) {
            return '0';
        }


        try {
            const client = hederaConfig.getClient();

            const accountBalance = await new AccountBalanceQuery()
                .setAccountId(accountId)
                .execute(client);

            const tokenBalance = accountBalance.tokens.get(this.greenTokenId);
            const decimals = parseInt(process.env.GREEN_TOKEN_DECIMALS) || 2;

            return tokenBalance ?
                (tokenBalance.toNumber() / Math.pow(10, decimals)).toString() :
                '0';
        } catch (error) {
            console.error(`❌ Failed to get token balance for ${accountId}:`, error.message);
            throw new Error(`Balance query failed: ${error.message}`);
        }
    }

    /**
     * Get GREEN token information
     */
    async getTokenInfo() {
        await this.initialize();

        if (!this.greenTokenId) {
            throw new Error('GREEN token not created yet');
        }


        try {
            const client = hederaConfig.getClient();

            const tokenInfo = await new TokenInfoQuery()
                .setTokenId(this.greenTokenId)
                .execute(client);

            return {
                tokenId: tokenInfo.tokenId.toString(),
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals,
                totalSupply: tokenInfo.totalSupply.toString(),
                treasuryAccountId: tokenInfo.treasuryAccountId.toString(),
                supplyType: tokenInfo.supplyType.toString(),
                tokenType: tokenInfo.tokenType.toString()
            };
        } catch (error) {
            console.error('❌ Failed to get token info:', error.message);
            throw new Error(`Token info query failed: ${error.message}`);
        }
    }

    /**
     * Associate token with account (required before receiving tokens)
     */
    async associateTokenWithAccount(accountId, accountPrivateKey) {
        await this.initialize();

        if (!this.greenTokenId) {
            throw new Error('GREEN token not created yet');
        }

        try {
            const client = hederaConfig.getClient();

            const associateTx = new TokenAssociateTransaction()
                .setAccountId(accountId)
                .setTokenIds([this.greenTokenId])
                .setMaxTransactionFee(new Hbar(2))
                .freezeWith(client);

            const associateSign = await associateTx.sign(accountPrivateKey);
            const associateSubmit = await associateSign.execute(client);
            const associateRx = await associateSubmit.getReceipt(client);

            console.log(`✅ Associated GREEN token with account ${accountId}`);
            console.log(`Association Transaction ID: ${associateSubmit.transactionId}`);

            return {
                transactionId: associateSubmit.transactionId.toString(),
                status: associateRx.status.toString()
            };
        } catch (error) {
            console.error(`❌ Failed to associate token with account ${accountId}:`, error.message);
            throw new Error(`Token association failed: ${error.message}`);
        }
    }

    /**
     * Mint initial supply of GREEN tokens to treasury
     */
    async mintInitialSupply(amount) {
        await this.initialize();

        if (!this.greenTokenId) {
            throw new Error('GREEN token not created yet. Call createGreenToken() first.');
        }

        try {
            const client = hederaConfig.getClient();
            const treasuryAccount = hederaConfig.getTreasuryAccount();
            const decimals = parseInt(process.env.GREEN_TOKEN_DECIMALS) || 2;
            const tokensToMint = amount * Math.pow(10, decimals); // Convert to token units

            console.log(`Minting ${amount} GREEN tokens (${tokensToMint} units) to treasury...`);

            // Mint tokens to treasury
            const tokenMintTx = new TokenMintTransaction()
                .setTokenId(this.greenTokenId)
                .setAmount(tokensToMint)
                .setMaxTransactionFee(new Hbar(5))
                .freezeWith(client);

            const tokenMintSign = await tokenMintTx.sign(treasuryAccount.privateKey);
            const tokenMintSubmit = await tokenMintSign.execute(client);
            const tokenMintRx = await tokenMintSubmit.getReceipt(client);

            console.log(`✅ Successfully minted ${amount} GREEN tokens to treasury`);
            console.log(`Mint Transaction ID: ${tokenMintSubmit.transactionId}`);

            return {
                transactionId: tokenMintSubmit.transactionId.toString(),
                tokensMinted: amount,
                status: tokenMintRx.status.toString(),
                tokenId: this.greenTokenId
            };
        } catch (error) {
            console.error('❌ Failed to mint initial supply:', error.message);
            throw new Error(`Initial mint failed: ${error.message}`);
        }
    }

    /**
     * Get the current GREEN token ID
     */
    getGreenTokenId() {
        return this.greenTokenId;
    }

    /**
     * Set GREEN token ID (for loading existing tokens)
     */
    setGreenTokenId(tokenId) {
        this.greenTokenId = tokenId;
    }
}

module.exports = new TokenService();