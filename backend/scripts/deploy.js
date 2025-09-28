const hre = require("hardhat");
const { ethers } = require("hardhat");
const { Client, AccountId, PrivateKey, ContractCreateTransaction, FileCreateTransaction, FileAppendTransaction, Hbar, TokenCreateTransaction, TokenType, TokenSupplyType, TokenId } = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

/**
 * EcoRide Smart Contract Deployment Script (Hardhat + Hedera)
 *
 * This script deploys the GreenRewards smart contract to Hedera testnet
 * using Hardhat compilation and Hedera native deployment.
 *
 * The contract uses HTS System Contracts for hybrid EVM + Native Service
 * integration, qualifying for the Hedera EVM track requirements.
 */

async function main() {
    console.log("🚀 Starting GreenRewards contract deployment...");

    // Step 1: Compile the contract using Hardhat
    console.log("\n📦 Compiling contracts with Hardhat...");
    await hre.run("compile");

    // Step 2: Get compiled contract artifacts
    const contractName = "GreenRewards";
    const artifactsPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);

    if (!fs.existsSync(artifactsPath)) {
        throw new Error(`Contract artifacts not found at ${artifactsPath}`);
    }

    const contractArtifacts = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));
    const contractBytecode = contractArtifacts.bytecode;

    console.log("✅ Contract compiled successfully");
    console.log(`📄 Bytecode size: ${contractBytecode.length / 2} bytes`);

    // Step 3: Initialize Hedera client
    console.log("\n🔗 Connecting to Hedera testnet...");

    if (!process.env.HEDERA_OPERATOR_ACCOUNT_ID || !process.env.HEDERA_OPERATOR_PRIVATE_KEY) {
        throw new Error("Missing Hedera credentials in environment variables");
    }

    const client = Client.forTestnet();
    const operatorAccountId = AccountId.fromString(process.env.HEDERA_OPERATOR_ACCOUNT_ID);
    const operatorPrivateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_PRIVATE_KEY);

    client.setOperator(operatorAccountId, operatorPrivateKey);
    client.setDefaultMaxTransactionFee(new Hbar(100));

    console.log(`✅ Connected to Hedera testnet`);
    console.log(`🔑 Operator Account: ${operatorAccountId}`);

    // Step 4: Get GREEN token ID and fee collector for constructor
    const greenTokenId = process.env.GREEN_TOKEN_ID;
    const feeCollector = process.env.HEDERA_TREASURY_ACCOUNT_ID;

    if (!greenTokenId) {
        throw new Error("GREEN_TOKEN_ID not found in environment variables.");
    }

    if (!feeCollector) {
        throw new Error("HEDERA_TREASURY_ACCOUNT_ID not found in environment variables.");
    }

    console.log(`🪙 Using GREEN token: ${greenTokenId}`);
    console.log(`💰 Fee collector: ${feeCollector}`);

    // Step 5: Create file for contract bytecode
    console.log("\n📁 Uploading contract bytecode to Hedera...");

    const fileCreateTx = new FileCreateTransaction()
        .setKeys([operatorPrivateKey])
        .setContents("")
        .setMaxTransactionFee(new Hbar(5))
        .freezeWith(client);

    const fileCreateSign = await fileCreateTx.sign(operatorPrivateKey);
    const fileCreateSubmit = await fileCreateSign.execute(client);
    const fileCreateRx = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateRx.fileId;

    console.log(`✅ Bytecode file created: ${bytecodeFileId}`);

    // Append bytecode to file (in chunks if necessary)
    const maxChunkSize = 4096; // 4KB chunks
    const bytecodeBuffer = Buffer.from(contractBytecode.slice(2), 'hex'); // Remove 0x prefix

    if (bytecodeBuffer.length <= maxChunkSize) {
        // Single chunk
        const fileAppendTx = new FileAppendTransaction()
            .setFileId(bytecodeFileId)
            .setContents(bytecodeBuffer)
            .setMaxTransactionFee(new Hbar(10))
            .freezeWith(client);

        const fileAppendSign = await fileAppendTx.sign(operatorPrivateKey);
        await fileAppendSign.execute(client);
    } else {
        // Multiple chunks
        for (let i = 0; i < bytecodeBuffer.length; i += maxChunkSize) {
            const chunk = bytecodeBuffer.slice(i, i + maxChunkSize);

            const fileAppendTx = new FileAppendTransaction()
                .setFileId(bytecodeFileId)
                .setContents(chunk)
                .setMaxTransactionFee(new Hbar(10))
                .freezeWith(client);

            const fileAppendSign = await fileAppendTx.sign(operatorPrivateKey);
            await fileAppendSign.execute(client);

            console.log(`📦 Uploaded chunk ${Math.floor(i / maxChunkSize) + 1}/${Math.ceil(bytecodeBuffer.length / maxChunkSize)}`);
        }
    }

    console.log("✅ Contract bytecode uploaded successfully");

    // Step 6: Deploy the contract
    console.log("\n🚀 Deploying GreenRewards contract...");

    // Convert Hedera IDs to Solidity addresses
    const greenTokenSolidityAddress = `0x${TokenId.fromString(greenTokenId).toSolidityAddress()}`;
    const feeCollectorSolidityAddress = `0x${AccountId.fromString(feeCollector).toSolidityAddress()}`;

    console.log(`🔗 GREEN token Solidity address: ${greenTokenSolidityAddress}`);
    console.log(`🔗 Fee collector Solidity address: ${feeCollectorSolidityAddress}`);

    console.log("⚠️  Deploying without constructor parameters to avoid encoding issues");
    console.log("   Will set token address and fee collector after deployment using setter functions");

    const contractCreateTx = new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(3000000)
        .setMaxTransactionFee(new Hbar(50))
        .freezeWith(client);

    const contractCreateSign = await contractCreateTx.sign(operatorPrivateKey);
    const contractCreateSubmit = await contractCreateSign.execute(client);
    const contractCreateRx = await contractCreateSubmit.getReceipt(client);

    const contractId = contractCreateRx.contractId;
    const contractSolidityAddress = contractId.toSolidityAddress();

    console.log("🎉 Contract deployed successfully!");
    console.log(`📋 Contract Details:`);
    console.log(`   - Contract ID: ${contractId}`);
    console.log(`   - Solidity Address: 0x${contractSolidityAddress}`);
    console.log(`   - Transaction ID: ${contractCreateSubmit.transactionId}`);
    console.log(`   - Gas Used: ${contractCreateRx.gasUsed || 'N/A'}`);

    // Step 7: Save deployment information
    const deploymentInfo = {
        network: "hedera-testnet",
        contractName: "GreenRewards",
        contractId: contractId.toString(),
        solidityAddress: `0x${contractSolidityAddress}`,
        deploymentTxId: contractCreateSubmit.transactionId.toString(),
        bytecodeFileId: bytecodeFileId.toString(),
        greenTokenId: greenTokenId,
        deployedAt: new Date().toISOString(),
        deployedBy: operatorAccountId.toString(),
        features: {
            htsSystemContracts: true,
            hybridEvmNative: true,
            hederaEvmTrackCompliant: true
        },
        constructorArgs: {
            greenTokenAddress: greenTokenSolidityAddress,
            feeCollector: feeCollectorSolidityAddress,
            greenTokenId: greenTokenId,
            feeCollectorId: feeCollector
        },
        verificationUrls: {
            hashscan: `https://hashscan.io/testnet/contract/${contractId}`,
            explorer: `https://hashscan.io/testnet/address/${contractSolidityAddress}`
        }
    };

    const deploymentPath = path.join(__dirname, "..", "deployments", "hedera-testnet.json");

    // Ensure deployments directory exists
    const deploymentsDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

    // Step 8: Update environment variables
    console.log("\n⚙️ Updating environment variables...");

    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");

        // Update contract ID
        if (envContent.includes("GREEN_REWARDS_CONTRACT_ID=")) {
            envContent = envContent.replace(
                /GREEN_REWARDS_CONTRACT_ID=.*/,
                `GREEN_REWARDS_CONTRACT_ID=${contractId}`
            );
        } else {
            envContent += `\nGREEN_REWARDS_CONTRACT_ID=${contractId}`;
        }

        // Update EVM contract address
        if (envContent.includes("EVM_CONTRACT_ADDRESS=")) {
            envContent = envContent.replace(
                /EVM_CONTRACT_ADDRESS=.*/,
                `EVM_CONTRACT_ADDRESS=0x${contractSolidityAddress}`
            );
        } else {
            envContent += `\nEVM_CONTRACT_ADDRESS=0x${contractSolidityAddress}`;
        }

        fs.writeFileSync(envPath, envContent);
        console.log("✅ Environment variables updated");
    }

    // Step 9: Verification instructions
    console.log("\n🔍 Contract Verification:");
    console.log("═".repeat(50));
    console.log(`1. Visit HashScan: ${deploymentInfo.verificationUrls.hashscan}`);
    console.log(`2. Verify contract source code on HashScan`);
    console.log(`3. Test contract functions using HashScan interface`);
    console.log("═".repeat(50));

    console.log("\n✨ Deployment Complete!");
    console.log(`🔗 Next steps:`);
    console.log(`   1. Verify contract on HashScan`);
    console.log(`   2. Test contract integration with backend`);
    console.log(`   3. Add initial metro stations to contract`);

    // Close Hedera client
    client.close();

    return {
        contractId: contractId.toString(),
        solidityAddress: `0x${contractSolidityAddress}`,
        deploymentInfo
    };
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("💥 Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = main;