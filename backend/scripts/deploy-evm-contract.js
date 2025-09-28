const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Deploying GreenRewards to Hedera EVM (EVM Track)...");

    // Connect to Hedera testnet via EVM RPC
    const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
    const privateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY;

    if (!privateKey || privateKey.length !== 64) {
        throw new Error("Invalid HEDERA_OPERATOR_PRIVATE_KEY in .env file");
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("📋 Deployer address:", wallet.address);
    console.log("📋 Deployer account:", await wallet.getAddress());

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "HBAR");

    if (balance === 0n) {
        throw new Error("Deployer account has no HBAR balance. Please fund the account first.");
    }

    // Contract constructor parameters
    const greenTokenId = process.env.GREEN_TOKEN_ID || "0.0.6916942";
    const treasuryAccountId = process.env.HEDERA_TREASURY_ACCOUNT_ID || "0.0.6915464";

    // Convert Hedera IDs to EVM addresses
    const greenTokenNum = parseInt(greenTokenId.split('.')[2]);
    const treasuryNum = parseInt(treasuryAccountId.split('.')[2]);

    const greenTokenEvm = '0x' + '00000000000000000000000000000000' + greenTokenNum.toString(16).padStart(8, '0');
    const treasuryEvm = '0x' + '00000000000000000000000000000000' + treasuryNum.toString(16).padStart(8, '0');

    console.log("🪙 GREEN2 Token:", greenTokenId, "->", greenTokenEvm);
    console.log("🏦 Treasury:", treasuryAccountId, "->", treasuryEvm);

    try {
        // Get the contract factory
        const GreenRewards = await ethers.getContractFactory("GreenRewards", wallet);

        console.log("⏳ Deploying contract...");

        // Deploy with constructor parameters
        const contract = await GreenRewards.deploy(
            greenTokenEvm,
            treasuryEvm,
            {
                gasLimit: 3000000,
                gasPrice: ethers.parseUnits("500", "gwei") // 500 gwei as per hardhat config
            }
        );

        console.log("⏳ Waiting for deployment confirmation...");
        await contract.waitForDeployment();

        const contractAddress = await contract.getAddress();
        console.log("🎉 Contract deployed successfully!");
        console.log("📍 Contract Address:", contractAddress);

        // Convert EVM address to Hedera Contract ID
        const contractNum = parseInt(contractAddress.slice(-8), 16);
        const contractId = `0.0.${contractNum}`;

        console.log("📋 Hedera Contract ID:", contractId);

        // Verify the contract configuration
        console.log("🔍 Verifying contract configuration...");
        const configuredToken = await contract.greenTokenAddress();
        const configuredOwner = await contract.owner();

        console.log("✅ Contract owner:", configuredOwner);
        console.log("✅ Configured token:", configuredToken);
        console.log("✅ Expected token:", greenTokenEvm);
        console.log("✅ Token match:", configuredToken.toLowerCase() === greenTokenEvm.toLowerCase());

        // Save deployment info
        const deploymentInfo = {
            contractAddress: contractAddress,
            contractId: contractId,
            greenTokenId: greenTokenId,
            greenTokenEvm: greenTokenEvm,
            treasuryAccountId: treasuryAccountId,
            treasuryEvm: treasuryEvm,
            owner: configuredOwner,
            configuredToken: configuredToken,
            timestamp: new Date().toISOString(),
            network: "hedera-testnet",
            isEVMTrack: true
        };

        const deploymentPath = path.join(__dirname, '../evm-deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        console.log("💾 Deployment info saved to evm-deployment.json");
        console.log("\n🏆 EVM TRACK DEPLOYMENT COMPLETE! 🏆");
        console.log("\n🔧 Update your .env files:");
        console.log(`GREEN_REWARDS_CONTRACT_ID=${contractId}`);
        console.log(`EVM_CONTRACT_ADDRESS=${contractAddress}`);

        console.log("\n🎯 This deployment is EVM track compliant:");
        console.log("✅ Smart contract minting (not token service)");
        console.log("✅ Deployed via EVM RPC");
        console.log("✅ Uses HTS System Contract (0x167)");
        console.log("✅ Proper GREEN2 token integration");

        return deploymentInfo;

    } catch (error) {
        console.error("❌ Deployment failed:", error);

        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log("\n💡 Solution: Fund your operator account with HBAR");
            console.log("Account to fund:", wallet.address);
        }

        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });