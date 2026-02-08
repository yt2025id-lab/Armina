export const ARMINA_CCIP_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_router", "type": "address" },
      { "internalType": "address", "name": "_pool", "type": "address" },
      { "internalType": "address", "name": "_idrx", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }],
    "name": "SenderNotAllowed",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "uint64", "name": "sourceChainSelector", "type": "uint64" }],
    "name": "SourceChainNotAllowed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "messageId", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "poolId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "participant", "type": "address" }
    ],
    "name": "CrossChainJoinProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "messageId", "type": "bytes32" },
      { "indexed": true, "internalType": "uint64", "name": "sourceChainSelector", "type": "uint64" },
      { "indexed": false, "internalType": "address", "name": "participant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "poolId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "CrossChainJoinReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint64", "name": "chainSelector", "type": "uint64" },
      { "indexed": false, "internalType": "bool", "name": "allowed", "type": "bool" }
    ],
    "name": "SourceChainAllowed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "arminaPool",
    "outputs": [{ "internalType": "contract IArminaPoolCCIP", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint64", "name": "", "type": "uint64" }],
    "name": "allowedSourceChains",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "messageId", "type": "bytes32" }],
    "name": "getCrossChainJoin",
    "outputs": [
      {
        "components": [
          { "internalType": "bytes32", "name": "messageId", "type": "bytes32" },
          { "internalType": "uint64", "name": "sourceChain", "type": "uint64" },
          { "internalType": "address", "name": "participant", "type": "address" },
          { "internalType": "uint256", "name": "poolId", "type": "uint256" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
          { "internalType": "bool", "name": "processed", "type": "bool" }
        ],
        "internalType": "struct ArminaCCIP.CrossChainJoin",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRouter",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalJoinMessages",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "idrxToken",
    "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCrossChainJoins",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
