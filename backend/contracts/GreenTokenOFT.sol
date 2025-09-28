// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title GreenTokenOFT - EcoRide Cross-Chain GREEN Token
 * @dev LayerZero OFT implementation for GREEN token cross-chain transfers
 * @dev Minimal implementation for Hedera EVM Track demonstration
 */

// LayerZero interfaces (simplified for minimal implementation)
interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint nativeFee, uint zroFee);

    function getInboundNonce(uint16 _srcChainId, bytes calldata _srcAddress) external view returns (uint64);
    function getOutboundNonce(uint16 _dstChainId, address _srcAddress) external view returns (uint64);
}

interface ILayerZeroReceiver {
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external;
}

interface ILayerZeroUserApplicationConfig {
    function setConfig(
        uint16 _version,
        uint16 _chainId,
        uint _configType,
        bytes calldata _config
    ) external;

    function setSendVersion(uint16 _version) external;
    function setReceiveVersion(uint16 _version) external;
    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external;
}

contract GreenTokenOFT is ERC20, Ownable, ILayerZeroReceiver, ILayerZeroUserApplicationConfig {
    ILayerZeroEndpoint public immutable lzEndpoint;

    // LayerZero chain IDs
    uint16 public constant HEDERA_TESTNET_CHAIN_ID = 10296; // Example chain ID
    uint16 public constant ETHEREUM_TESTNET_CHAIN_ID = 10121; // Ethereum testnet
    uint16 public constant BSC_TESTNET_CHAIN_ID = 10102; // BSC testnet

    // Cross-chain configuration
    mapping(uint16 => bytes) public trustedRemoteLookup;
    mapping(uint16 => mapping(bytes => mapping(uint64 => bool))) public creditedPackets;

    // Cross-chain statistics
    mapping(uint16 => uint256) public chainTotalSent;
    mapping(uint16 => uint256) public chainTotalReceived;
    uint256 public totalCrossChainTransfers;

    // GREEN token integration with existing EcoRide system
    address public ecoRideRewardsContract;
    uint256 public constant DECIMALS_PRECISION = 1e2; // GREEN token uses 2 decimals

    event SendToChain(
        uint16 indexed _dstChainId,
        address indexed _from,
        bytes indexed _toAddress,
        uint _amount
    );

    event ReceiveFromChain(
        uint16 indexed _srcChainId,
        address indexed _to,
        uint _amount
    );

    event SetTrustedRemote(uint16 _srcChainId, bytes _srcAddress);
    event CrossChainTransferCompleted(uint16 srcChain, uint16 dstChain, address user, uint256 amount);

    modifier onlyEndpoint() {
        require(msg.sender == address(lzEndpoint), "Only LayerZero endpoint");
        _;
    }

    constructor(
        address _lzEndpoint,
        address _ecoRideRewards
    ) ERC20("EcoRide GREEN Token", "GREEN") Ownable(msg.sender) {
        require(_lzEndpoint != address(0), "Invalid LayerZero endpoint");
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
        ecoRideRewardsContract = _ecoRideRewards;

        // Initial supply for demonstration (1M GREEN tokens)
        _mint(msg.sender, 1000000 * DECIMALS_PRECISION);
    }

    /**
     * @dev Override decimals to match GREEN token standard (2 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 2;
    }

    /**
     * @dev Send GREEN tokens to another chain
     * @param _dstChainId Target chain ID
     * @param _toAddress Recipient address on target chain
     * @param _amount Amount of GREEN tokens to send
     * @param _adapterParams LayerZero adapter parameters
     */
    function sendToChain(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) external payable {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= balanceOf(msg.sender), "Insufficient balance");
        require(trustedRemoteLookup[_dstChainId].length > 0, "Destination chain not supported");

        // Burn tokens from sender
        _burn(msg.sender, _amount);

        // Prepare cross-chain payload
        bytes memory payload = abi.encode(PT_SEND, msg.sender, _toAddress, _amount);

        // Send via LayerZero
        lzEndpoint.send{value: msg.value}(
            _dstChainId,
            trustedRemoteLookup[_dstChainId],
            payload,
            payable(msg.sender),
            address(0),
            _adapterParams
        );

        // Update statistics
        chainTotalSent[_dstChainId] += _amount;
        totalCrossChainTransfers++;

        emit SendToChain(_dstChainId, msg.sender, _toAddress, _amount);
    }

    /**
     * @dev Estimate fees for cross-chain transfer
     */
    function estimateSendFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes memory _adapterParams
    ) external view returns (uint nativeFee, uint zroFee) {
        bytes memory payload = abi.encode(PT_SEND, msg.sender, _toAddress, _amount);
        return lzEndpoint.estimateFees(_dstChainId, address(this), payload, _useZro, _adapterParams);
    }

    /**
     * @dev LayerZero receive function
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) external override onlyEndpoint {
        require(
            keccak256(_srcAddress) == keccak256(trustedRemoteLookup[_srcChainId]),
            "Invalid source address"
        );

        require(!creditedPackets[_srcChainId][_srcAddress][_nonce], "Packet already credited");

        creditedPackets[_srcChainId][_srcAddress][_nonce] = true;

        (uint16 packetType, , bytes memory toAddressBytes, uint256 amount) =
            abi.decode(_payload, (uint16, address, bytes, uint256));

        require(packetType == PT_SEND, "Invalid packet type");

        address toAddress = bytesToAddress(toAddressBytes);

        // Mint tokens to recipient
        _mint(toAddress, amount);

        // Update statistics
        chainTotalReceived[_srcChainId] += amount;

        emit ReceiveFromChain(_srcChainId, toAddress, amount);
        emit CrossChainTransferCompleted(_srcChainId, getCurrentChainId(), toAddress, amount);
    }

    /**
     * @dev Set trusted remote contract for cross-chain communication
     */
    function setTrustedRemote(uint16 _srcChainId, bytes memory _srcAddress) external onlyOwner {
        trustedRemoteLookup[_srcChainId] = _srcAddress;
        emit SetTrustedRemote(_srcChainId, _srcAddress);
    }

    /**
     * @dev Check if source chain is trusted
     */
    function isTrustedRemote(uint16 _srcChainId, bytes memory _srcAddress) external view returns (bool) {
        return keccak256(trustedRemoteLookup[_srcChainId]) == keccak256(_srcAddress);
    }

    /**
     * @dev Get cross-chain statistics for a specific chain
     */
    function getChainStats(uint16 _chainId) external view returns (
        uint256 totalSent,
        uint256 totalReceived,
        bool isSupported
    ) {
        return (
            chainTotalSent[_chainId],
            chainTotalReceived[_chainId],
            trustedRemoteLookup[_chainId].length > 0
        );
    }

    /**
     * @dev Get supported chains
     */
    function getSupportedChains() external pure returns (uint16[] memory chains, string[] memory names) {
        chains = new uint16[](3);
        names = new string[](3);

        chains[0] = HEDERA_TESTNET_CHAIN_ID;
        names[0] = "Hedera Testnet";

        chains[1] = ETHEREUM_TESTNET_CHAIN_ID;
        names[1] = "Ethereum Sepolia";

        chains[2] = BSC_TESTNET_CHAIN_ID;
        names[2] = "BSC Testnet";

        return (chains, names);
    }

    /**
     * @dev Emergency function to mint tokens (for testing/demo)
     */
    function emergencyMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Integration with EcoRide rewards system
     */
    function setEcoRideRewardsContract(address _newContract) external onlyOwner {
        ecoRideRewardsContract = _newContract;
    }

    // LayerZero configuration functions (interface compliance)
    function setConfig(
        uint16 _version,
        uint16 _chainId,
        uint _configType,
        bytes memory _config
    ) external override onlyOwner {
        // Interface compliance - configuration handled by LayerZero endpoint
    }

    function setSendVersion(uint16 _version) external override onlyOwner {
        // Interface compliance - version setting handled by LayerZero endpoint
    }

    function setReceiveVersion(uint16 _version) external override onlyOwner {
        // Interface compliance - version setting handled by LayerZero endpoint
    }

    function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress) external override onlyOwner {
        // Interface compliance - force resume handled by LayerZero endpoint
    }

    // Utility functions
    uint16 internal constant PT_SEND = 0;

    function getCurrentChainId() internal pure returns (uint16) {
        return HEDERA_TESTNET_CHAIN_ID; // This would be dynamic in production
    }

    function bytesToAddress(bytes memory _bytes) internal pure returns (address) {
        require(_bytes.length == 20, "Invalid address length");
        address addr;
        assembly {
            addr := mload(add(_bytes, 20))
        }
        return addr;
    }

    function addressToBytes(address _addr) internal pure returns (bytes memory) {
        return abi.encodePacked(_addr);
    }

    /**
     * @dev Contract information for verification
     */
    function getContractInfo() external pure returns (
        string memory name,
        string memory version,
        string memory description
    ) {
        return (
            "GreenTokenOFT",
            "1.0.0",
            "EcoRide GREEN token with LayerZero cross-chain interoperability for Hedera EVM Track"
        );
    }
}