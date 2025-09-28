const { Client, AccountId, PrivateKey, AccountBalanceQuery, Hbar } = require("@hashgraph/sdk");
require('dotenv').config();

class HederaConfig {
  constructor() {
    this.client = null;
    this.operatorAccountId = null;
    this.operatorPrivateKey = null;
    this.treasuryAccountId = null;
    this.treasuryPrivateKey = null;
  }

  async initialize() {
    try {

      this.validateEnvironment();

      this.operatorAccountId = AccountId.fromString(process.env.HEDERA_OPERATOR_ACCOUNT_ID);
      this.operatorPrivateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_PRIVATE_KEY);

      this.treasuryAccountId = AccountId.fromString(process.env.HEDERA_TREASURY_ACCOUNT_ID);
      this.treasuryPrivateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_TREASURY_PRIVATE_KEY);

      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);

      this.client.setDefaultMaxTransactionFee(new Hbar(1)); // 1 HBAR
      this.client.setDefaultMaxQueryPayment(new Hbar(0.5)); // 0.5 HBAR


      return this.client;
    } catch (error) {
      throw new Error(`Hedera initialization failed: ${error.message}`);
    }
  }

  validateEnvironment() {

    const requiredEnvVars = [
      'HEDERA_OPERATOR_ACCOUNT_ID',
      'HEDERA_OPERATOR_PRIVATE_KEY',
      'HEDERA_TREASURY_ACCOUNT_ID',
      'HEDERA_TREASURY_PRIVATE_KEY'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    try {
      AccountId.fromString(process.env.HEDERA_OPERATOR_ACCOUNT_ID);
      AccountId.fromString(process.env.HEDERA_TREASURY_ACCOUNT_ID);
    } catch (error) {
      throw new Error('Invalid account ID format in environment variables');
    }

    try {
      PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_PRIVATE_KEY);
      PrivateKey.fromStringECDSA(process.env.HEDERA_TREASURY_PRIVATE_KEY);
    } catch (error) {
      throw new Error('Invalid private key format in environment variables');
    }
  }

  getClient() {
    if (!this.client) {
      throw new Error('Hedera client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  getOperatorAccount() {
    return {
      accountId: this.operatorAccountId,
      privateKey: this.operatorPrivateKey
    };
  }

  getTreasuryAccount() {
    return {
      accountId: this.treasuryAccountId,
      privateKey: this.treasuryPrivateKey
    };
  }

  async checkBalance(accountId) {
    try {
      const client = this.getClient();
      const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);

      return balance.hbars.toBigNumber().toString();
    } catch (error) {
      throw error;
    }
  }

  async close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// Export singleton instance
const hederaConfig = new HederaConfig();

module.exports = {
  HederaConfig,
  hederaConfig,
  getHederaClient: () => hederaConfig.getClient(),
  getOperatorAccount: () => hederaConfig.getOperatorAccount(),
  getTreasuryAccount: () => hederaConfig.getTreasuryAccount(),
  initializeHedera: () => hederaConfig.initialize(),
  closeHedera: () => hederaConfig.close()
};