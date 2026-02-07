/**
 * Smart Contract Configuration
 * Deployed contracts on Base Sepolia Testnet
 */

export const CONTRACTS = {
  // IDRX Token - Mock ERC20 for testing
  IDRX: {
    address: process.env.NEXT_PUBLIC_IDRX_ADDRESS as `0x${string}`,
    chainId: 84532, // Base Sepolia
  },

  // ArminaPool - Main arisan pool contract
  ARMINA_POOL: {
    address: process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS as `0x${string}`,
    chainId: 84532, // Base Sepolia
  },

  // ArminaYieldOptimizer - AI yield optimization
  YIELD_OPTIMIZER: {
    address: process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS as `0x${string}`,
    chainId: 84532, // Base Sepolia
  },

  // ArminaAutomation - Chainlink Automation keeper
  AUTOMATION: {
    address: process.env.NEXT_PUBLIC_AUTOMATION_ADDRESS as `0x${string}`,
    chainId: 84532, // Base Sepolia
  },

  // ArminaFunctions - Chainlink Functions for off-chain APY data
  FUNCTIONS: {
    address: process.env.NEXT_PUBLIC_FUNCTIONS_ADDRESS as `0x${string}`,
    chainId: 84532, // Base Sepolia
  },
} as const;

// Network configuration
export const SUPPORTED_CHAINS = {
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://sepolia.base.org'],
      },
      public: {
        http: ['https://sepolia.base.org'],
      },
    },
    blockExplorers: {
      default: {
        name: 'BaseScan',
        url: 'https://sepolia.basescan.org',
      },
    },
    testnet: true,
  },
} as const;

// Contract addresses for easy access
export const CONTRACT_ADDRESSES = {
  IDRX: CONTRACTS.IDRX.address,
  ARMINA_POOL: CONTRACTS.ARMINA_POOL.address,
  YIELD_OPTIMIZER: CONTRACTS.YIELD_OPTIMIZER.address,
  AUTOMATION: CONTRACTS.AUTOMATION.address,
  FUNCTIONS: CONTRACTS.FUNCTIONS.address,
} as const;

// Export individual addresses
export const IDRX_ADDRESS = process.env.NEXT_PUBLIC_IDRX_ADDRESS as `0x${string}`;
export const ARMINA_POOL_ADDRESS = process.env.NEXT_PUBLIC_ARMINA_POOL_ADDRESS as `0x${string}`;
export const YIELD_OPTIMIZER_ADDRESS = process.env.NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS as `0x${string}`;
export const AUTOMATION_ADDRESS = process.env.NEXT_PUBLIC_AUTOMATION_ADDRESS as `0x${string}`;
export const FUNCTIONS_ADDRESS = process.env.NEXT_PUBLIC_FUNCTIONS_ADDRESS as `0x${string}`;

// Chain ID
export const CHAIN_ID = 84532; // Base Sepolia
