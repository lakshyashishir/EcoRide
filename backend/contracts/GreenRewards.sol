// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GreenRewards - EcoRide Sustainable Transit Rewards
 * @dev Smart contract for GREEN token rewards on metro journeys
 * @dev Uses HTS System Contracts (0x167) for hybrid EVM + Native Service integration
 * @dev Hedera EVM Track compliant
 */

// HTS System Contract interface
interface IHederaTokenService {
    function mintToken(
        address token,
        int64 amount,
        bytes[] memory metadata
    )
        external
        returns (
            int64 responseCode,
            int64 newTotalSupply,
            int64[] memory serialNumbers
        );

    function transferToken(
        address token,
        address sender,
        address recipient,
        int64 amount
    ) external returns (int64 responseCode);

    function associateToken(address account, address token)
        external
        returns (int64 responseCode);

    function getTokenInfo(address token)
        external
        view
        returns (int64 responseCode, bytes memory tokenInfo);
}

// Official Hedera response codes
library HederaResponseCodes {
    int32 public constant SUCCESS = 22;
    int32 public constant INVALID_TOKEN_ID = 167;
    int32 public constant TOKEN_NOT_ASSOCIATED_TO_ACCOUNT = 184;
    int32 public constant INSUFFICIENT_TOKEN_BALANCE = 178;
    int32 public constant TRANSACTION_REQUIRES_ZERO_TOKEN_BALANCES = 151;
    int32 public constant INVALID_SIGNATURE = 7;
}

contract GreenRewards {
    // HTS System Contract at precompiled address 0x167
    address constant HTS_PRECOMPILE_ADDRESS = address(0x167);
    IHederaTokenService constant HTS = IHederaTokenService(HTS_PRECOMPILE_ADDRESS);

    address public owner;
    address public greenTokenAddress; // GREEN token (GreenToken) address

    // Reward calculation constants
    uint256 public constant BASE_REWARD_MULTIPLIER = 10; // GREEN tokens per kg CO2 saved
    uint256 public constant PRECISION = 1e2; // GREEN token has 2 decimals

    // Merchant fee system (1-3%)
    uint256 public merchantFeePercent = 200; // 2% default (basis points)
    uint256 public constant MAX_MERCHANT_FEE = 300; // 3% maximum
    address public feeCollector;

    // Anti-fraud limits
    uint256 public constant MIN_JOURNEY_TIME = 5 minutes;
    uint256 public constant MAX_DAILY_REWARDS = 1000 * PRECISION; // 1000 GREEN per day
    uint256 public constant MAX_JOURNEY_DISTANCE = 50000; // 50km
    uint256 public constant MIN_JOURNEY_DISTANCE = 100; // 100m
    uint256 public constant JOURNEY_SUBMISSION_WINDOW = 2 hours;
    // Daily reward tracking
    mapping(address => uint256) public dailyRewards;
    mapping(address => uint256) public lastRewardDate;
    mapping(address => uint256) public lastJourneyTime;

    // Journey data structure
    struct Journey {
        address user;
        string fromStation;
        string toStation;
        uint256 distance; // meters
        uint256 carbonSaved; // grams CO2 from metro ticket
        uint256 tokensEarned; // GREEN tokens rewarded
        uint256 timestamp; // actual journey time
        uint256 submissionTime; // blockchain submission time
        string journeyId; // from QR code
        bytes32 qrCodeHash; // for duplicate prevention
        bool verified;
    }

    // Journey tracking
    mapping(string => Journey) public journeys;
    mapping(address => string[]) public userJourneys;
    mapping(string => bool) public processedJourneys;
    mapping(bytes32 => bool) public processedQRHashes;
    mapping(bytes32 => uint256) public qrHashTimestamp;

    // User statistics
    mapping(address => uint256) public totalCarbonSaved;
    mapping(address => uint256) public totalTokensEarned;
    mapping(address => uint256) public totalJourneys;

    // Global statistics
    uint256 public globalCarbonSaved;
    uint256 public globalTokensDistributed;
    uint256 public totalUsers;

    // Metro station validation
    mapping(string => bool) public validStations;
    string[] public stationList;

    event JourneyRecorded(
        address indexed user,
        string journeyId,
        string fromStation,
        string toStation,
        uint256 distance,
        uint256 carbonSaved,
        uint256 tokensEarned,
        uint256 timestamp
    );

    event TokensRewarded(address indexed user, uint256 amount);
    event MaxDailyRewardsUpdated(uint256 newLimit);
    event StationAdded(string stationName);
    event FraudAttemptDetected(address indexed user, string reason, string journeyId);
    event MerchantRedemption(address indexed user, address indexed merchant, uint256 amount, uint256 fee, string description);
    event MerchantFeeUpdated(uint256 newFeePercent);
    event FeeCollectorUpdated(address newFeeCollector);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validJourney(string memory journeyId, bytes32 qrCodeHash) {
        require(!processedJourneys[journeyId], "Journey already processed");
        require(!processedQRHashes[qrCodeHash], "QR code already used");
        require(bytes(journeyId).length > 0, "Invalid journey ID");
        _;
    }

    modifier antiFraud(address user, uint256 distance, uint256 journeyTimestamp) {
        require(user != address(0), "Invalid user address");
        require(distance >= MIN_JOURNEY_DISTANCE, "Journey too short");
        require(distance <= MAX_JOURNEY_DISTANCE, "Journey too long");
        require(
            journeyTimestamp + JOURNEY_SUBMISSION_WINDOW >= block.timestamp,
            "Journey submission expired"
        );
        require(
            lastJourneyTime[user] + MIN_JOURNEY_TIME <= block.timestamp,
            "Too soon since last journey"
        );
        _;
    }

    constructor(address _greenTokenAddress, address _feeCollector) {
        owner = msg.sender;
        greenTokenAddress = _greenTokenAddress; // GREEN token address
        feeCollector = _feeCollector;

        // Initialize Delhi Metro stations
        _initializeStations();
    }


    /**
     * @dev Record metro journey and distribute GREEN token rewards
     * @param carbonSaved CO2 savings from metro ticket (in grams)
     */
    function recordJourney(
        string memory journeyId,
        string memory fromStation,
        string memory toStation,
        uint256 distance,
        uint256 carbonSaved,
        address user,
        uint256 journeyTimestamp,
        bytes32 qrCodeHash
    ) external
        onlyOwner
        validJourney(journeyId, qrCodeHash)
        antiFraud(user, distance, journeyTimestamp)
    {
        // Validate metro stations
        require(validStations[fromStation], "Invalid origin station");
        require(validStations[toStation], "Invalid destination station");
        require(
            keccak256(bytes(fromStation)) != keccak256(bytes(toStation)),
            "Origin and destination cannot be same"
        );

        // Validate CO2 data from metro ticket
        require(carbonSaved > 0, "Invalid carbon savings data");
        require(carbonSaved <= distance * 200, "Carbon savings too high for distance");
        // Calculate GREEN token rewards
        uint256 tokensToMint = calculateTokenReward(carbonSaved);

        // Check daily limits
        uint256 today = block.timestamp / 86400;
        if (lastRewardDate[user] < today) {
            dailyRewards[user] = 0;
            lastRewardDate[user] = today;
        }

        if (dailyRewards[user] + tokensToMint > MAX_DAILY_REWARDS) {
            emit FraudAttemptDetected(user, "Daily limit exceeded", journeyId);
            revert("Daily reward limit exceeded");
        }

        Journey memory newJourney = Journey({
            user: user,
            fromStation: fromStation,
            toStation: toStation,
            distance: distance,
            carbonSaved: carbonSaved,
            tokensEarned: tokensToMint,
            timestamp: journeyTimestamp,
            submissionTime: block.timestamp,
            journeyId: journeyId,
            qrCodeHash: qrCodeHash,
            verified: true
        });

        journeys[journeyId] = newJourney;
        userJourneys[user].push(journeyId);
        processedJourneys[journeyId] = true;
        processedQRHashes[qrCodeHash] = true;
        qrHashTimestamp[qrCodeHash] = journeyTimestamp;

        lastJourneyTime[user] = block.timestamp;

        if (totalJourneys[user] == 0) {
            totalUsers++;
        }

        totalCarbonSaved[user] += carbonSaved;
        totalTokensEarned[user] += tokensToMint;
        totalJourneys[user]++;

        globalCarbonSaved += carbonSaved;
        globalTokensDistributed += tokensToMint;

        dailyRewards[user] += tokensToMint;

        // Mint and transfer GREEN tokens via HTS
        if (tokensToMint > 0) {
            _mintAndTransferTokens(user, tokensToMint);
        }

        emit JourneyRecorded(
            user,
            journeyId,
            fromStation,
            toStation,
            distance,
            carbonSaved,
            tokensToMint,
            journeyTimestamp
        );
    }

    /**
     * @dev Process merchant redemption with fee collection
     */
    function processMerchantRedemption(
        address user,
        address merchant,
        uint256 redeemAmount,
        string memory description
    ) external onlyOwner {
        require(user != address(0), "Invalid user address");
        require(merchant != address(0), "Invalid merchant address");
        require(redeemAmount > 0, "Invalid redeem amount");

        // Calculate merchant fee
        uint256 fee = (redeemAmount * merchantFeePercent) / 10000;
        uint256 merchantReceives = redeemAmount - fee;

        // Transfer GREEN tokens via HTS System Contract
        int64 responseCode = HTS.transferToken(
            greenTokenAddress,
            user,
            merchant,
            int64(uint64(merchantReceives))
        );
        require(responseCode == HederaResponseCodes.SUCCESS, "Transfer to merchant failed");

        // Transfer fee to collector
        if (fee > 0 && feeCollector != address(0)) {
            responseCode = HTS.transferToken(
                greenTokenAddress,
                user,
                feeCollector,
                int64(uint64(fee))
            );
            require(responseCode == HederaResponseCodes.SUCCESS, "Fee transfer failed");
        }

        emit MerchantRedemption(user, merchant, redeemAmount, fee, description);
    }

    /**
     * @dev Calculate GREEN token reward from CO2 savings
     * @param carbonSaved CO2 saved in grams
     * @return GREEN tokens to mint (with 2 decimals)
     */
    function calculateTokenReward(uint256 carbonSaved) public pure returns (uint256) {
        uint256 carbonSavedKg = carbonSaved / 1000; // convert grams to kg
        return carbonSavedKg * BASE_REWARD_MULTIPLIER * PRECISION;
    }

    /**
     * @dev Mint and transfer GREEN tokens using HTS System Contract
     */
    function _mintAndTransferTokens(address to, uint256 amount) internal {
        require(amount <= type(uint64).max, "Amount exceeds uint64 limit");

        // Mint GREEN tokens via HTS
        (int64 responseCode, , ) = HTS.mintToken(
            greenTokenAddress,
            int64(uint64(amount)),
            new bytes[](0)
        );
        require(responseCode == HederaResponseCodes.SUCCESS, "Token minting failed");

        // Transfer to user
        responseCode = HTS.transferToken(greenTokenAddress, address(this), to, int64(uint64(amount)));
        require(responseCode == HederaResponseCodes.SUCCESS, "Token transfer failed");

        emit TokensRewarded(to, amount);
    }

    function addStation(string memory stationName) external onlyOwner {
        require(bytes(stationName).length > 0, "Station name cannot be empty");
        require(!validStations[stationName], "Station already exists");

        validStations[stationName] = true;
        stationList.push(stationName);

        emit StationAdded(stationName);
    }

    function addMultipleStations(string[] memory stations) external onlyOwner {
        for (uint i = 0; i < stations.length; i++) {
            if (bytes(stations[i]).length > 0 && !validStations[stations[i]]) {
                validStations[stations[i]] = true;
                stationList.push(stations[i]);
                emit StationAdded(stations[i]);
            }
        }
    }

    function getValidStations() external view returns (string[] memory) {
        return stationList;
    }

    function isValidStation(string memory stationName) external view returns (bool) {
        return validStations[stationName];
    }

    function getUserJourneys(address user) external view returns (string[] memory) {
        return userJourneys[user];
    }

    function getJourney(string memory journeyId) external view returns (Journey memory) {
        return journeys[journeyId];
    }

    function getUserStats(address user) external view returns (
        uint256 carbonSaved,
        uint256 tokensEarned,
        uint256 journeyCount,
        uint256 lastJourney
    ) {
        return (
            totalCarbonSaved[user],
            totalTokensEarned[user],
            totalJourneys[user],
            lastJourneyTime[user]
        );
    }

    function getGlobalStats() external view returns (
        uint256 carbonSaved,
        uint256 tokensDistributed,
        uint256 userCount,
        uint256 journeyCount
    ) {
        uint256 journeyCountValue = 0;
        return (globalCarbonSaved, globalTokensDistributed, totalUsers, journeyCountValue);
    }

    function getDailyRewardStatus(address user) external view returns (
        uint256 remainingRewards,
        uint256 lastRewardDay
    ) {
        uint256 today = block.timestamp / 86400;
        uint256 usedToday = lastRewardDate[user] == today ? dailyRewards[user] : 0;
        uint256 remaining = MAX_DAILY_REWARDS > usedToday ? MAX_DAILY_REWARDS - usedToday : 0;

        return (remaining, lastRewardDate[user]);
    }

    /**
     * @dev Associate user with GREEN token (required for HTS)
     */
    function associateUserWithToken(address user) external {
        int64 responseCode = HTS.associateToken(user, greenTokenAddress);
        require(responseCode == HederaResponseCodes.SUCCESS, "Token association failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function setMerchantFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_MERCHANT_FEE, "Fee too high");
        merchantFeePercent = newFeePercent;
        emit MerchantFeeUpdated(newFeePercent);
    }

    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid address");
        feeCollector = newFeeCollector;
        emit FeeCollectorUpdated(newFeeCollector);
    }

    function getMerchantFeeInfo() external view returns (uint256 feePercent, address collector) {
        return (merchantFeePercent, feeCollector);
    }

    /**
     * @dev Initialize Delhi Metro stations
     */
    function _initializeStations() internal {
        string[20] memory initialStations = [
            "Rajiv Chowk",
            "Connaught Place",
            "Kashmere Gate",
            "AIIMS",
            "Hauz Khas",
            "Dwarka Sector 21",
            "Indira Gandhi International Airport",
            "New Delhi Railway Station",
            "Chandni Chowk",
            "Red Fort",
            "Yamuna Bank",
            "Akshardham",
            "Pragati Maidan",
            "Khan Market",
            "Lajpat Nagar",
            "Nehru Place",
            "Karol Bagh",
            "Uttam Nagar East",
            "Rohini Sector 18",
            "Pitampura"
        ];

        for (uint i = 0; i < initialStations.length; i++) {
            validStations[initialStations[i]] = true;
            stationList.push(initialStations[i]);
        }
    }

    function getContractInfo() external pure returns (
        string memory name,
        string memory version,
        string memory description
    ) {
        return (
            "GreenRewards",
            "1.0.0",
            "EcoRide GREEN token rewards for sustainable metro transit using HTS System Contracts"
        );
    }
}