const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🚀 Starting EcoRide GREEN Token OFT deployment (OFT only)...");

    // Get network configuration
    const network = hre.network.name;
    const config = hre.config.networks[network];

    if (!config || !config.layerZeroEndpoint) {
        throw new Error(`LayerZero endpoint not configured for network: ${network}`);
    }

    const layerZeroEndpoint = config.layerZeroEndpoint;
    console.log(`📡 Network: ${network}`);
    console.log(`🔗 LayerZero Endpoint: ${layerZeroEndpoint}`);

    // Get deployer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log(`👤 Deploying with account: ${deployerAddress}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployerAddress);
    console.log(`💰 Account balance: ${ethers.formatEther(balance)} HBAR`);

    if (balance < ethers.parseEther("0.1")) {
        console.warn("⚠️  Low balance detected. Make sure you have enough HBAR for deployment.");
    }

    // Use mock address for Green Rewards contract (can be updated later)
    const mockGreenRewardsAddress = "0x" + "2".repeat(40); // Mock placeholder
    console.log(`🔄 Using mock GreenRewards address: ${mockGreenRewardsAddress}`);

    // Deploy GREEN Token OFT
    console.log("🌱 Deploying GREEN Token OFT...");
    const GreenTokenOFT = await ethers.getContractFactory("GreenTokenOFT");

    const greenTokenOFT = await GreenTokenOFT.deploy(
        layerZeroEndpoint,
        mockGreenRewardsAddress,
        {
            gasLimit: 4000000, // Increased gas limit
            gasPrice: ethers.parseUnits("500", "gwei") // Use configured gas price
        }
    );

    console.log("⏳ Waiting for deployment transaction to be mined...");
    await greenTokenOFT.waitForDeployment();
    const oftAddress = await greenTokenOFT.getAddress();

    console.log("🎉 Deployment completed!");
    console.log("📋 Contract Addresses:");
    console.log(`   GREEN Token OFT: ${oftAddress}`);
    console.log(`   Mock GreenRewards: ${mockGreenRewardsAddress}`);
    console.log(`   LayerZero Endpoint: ${layerZeroEndpoint}`);

    // Verify contract info
    console.log("📝 Verifying contract deployment...");
    const contractInfo = await greenTokenOFT.getContractInfo();
    console.log(`   Name: ${contractInfo[0]}`);
    console.log(`   Version: ${contractInfo[1]}`);
    console.log(`   Description: ${contractInfo[2]}`);

    // Check token details
    const tokenName = await greenTokenOFT.name();
    const tokenSymbol = await greenTokenOFT.symbol();
    const tokenDecimals = await greenTokenOFT.decimals();
    const totalSupply = await greenTokenOFT.totalSupply();

    console.log("🪙 Token Details:");
    console.log(`   Name: ${tokenName}`);
    console.log(`   Symbol: ${tokenSymbol}`);
    console.log(`   Decimals: ${tokenDecimals}`);
    console.log(`   Initial Supply: ${ethers.formatUnits(totalSupply, tokenDecimals)} ${tokenSymbol}`);

    // Show supported chains
    const [chainIds, chainNames] = await greenTokenOFT.getSupportedChains();
    console.log("🌐 Supported Cross-Chain Networks:");
    for (let i = 0; i < chainIds.length; i++) {
        console.log(`   ${chainNames[i]} (Chain ID: ${chainIds[i]})`);
    }

    // Save deployment info
    const deploymentInfo = {
        network: network,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        contracts: {
            greenTokenOFT: oftAddress,
            greenRewards: mockGreenRewardsAddress,
            layerZeroEndpoint: layerZeroEndpoint
        },
        deployer: deployerAddress,
        deploymentTime: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };

    console.log("\n📄 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Instructions for next steps
    console.log("\n🔧 Next Steps for Cross-Chain Setup:");
    console.log("1. Deploy this contract on other supported networks (Ethereum Sepolia, BSC Testnet)");
    console.log("2. Set trusted remotes using setTrustedRemote() for each chain");
    console.log("3. Configure LayerZero pathways between chains");
    console.log("4. Test cross-chain transfers with small amounts");
    console.log("5. Verify contracts on Hashscan for transparency");

    console.log("\n🔗 Verification Command:");
    console.log(`npx hardhat verify --network ${network} ${oftAddress} "${layerZeroEndpoint}" "${mockGreenRewardsAddress}"`);

    console.log("\n✅ LayerZero OFT deployment successful!");
    console.log("🏆 Ready for Hedera EVM Track submission with cross-chain interoperability!");

    return {
        greenTokenOFT: oftAddress,
        greenRewards: mockGreenRewardsAddress,
        layerZeroEndpoint: layerZeroEndpoint
    };
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Deployment failed:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;