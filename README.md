# Armina — Arisan on Chain

Decentralized rotating savings (arisan) protocol on Base with Chainlink CRE integration — VRF for fair randomness, Automation for scheduled draws, Data Feeds for collateral pricing, and Functions for verified DeFi yields.

**Live Demo:** https://armina-finance.vercel.app
**Network:** Base Sepolia Testnet

## What is Armina?

Armina brings Indonesia's traditional rotating savings system (arisan) on-chain. Participants form pools, contribute monthly, and take turns receiving the full pot — all enforced by smart contracts with collateral protection.

**Key Features:**
- 125% collateral enforcement — eliminates default risk
- AI Yield Optimizer — idle collateral earns yield via DeFi protocols (Moonwell, Aave, Compound)
- Soulbound Reputation NFT — on-chain credit scoring with collateral discounts
- Coinbase Paymaster — gasless transactions, users pay zero gas fees
- IDRX stablecoin — IDR-pegged token for familiar value
- Mobile-first PWA with bilingual support (EN/ID)

## Chainlink CRE Integration

Armina uses **4 Chainlink products** working together as a Chainlink Runtime Environment (CRE):

> "Automation triggers monthly draws using VRF for fair randomness, Data Feeds ensure collateral is properly valued, and Functions fetch verified DeFi APY data on-chain."

| Chainlink Product | Contract | Usage |
|-------------------|----------|-------|
| **VRF V2.5** | ArminaPool | Provably fair random winner selection each round |
| **Automation** | ArminaAutomation | Autonomous monthly pool draws & yield harvesting |
| **Data Feeds** | ArminaPool | ETH/USD price oracle for collateral valuation in USD |
| **Functions** | ArminaFunctions | Decentralized off-chain APY data from DeFiLlama via DON |

### How CRE Works in Armina

1. **Chainlink Automation** monitors all active pools and triggers `performUpkeep()` when a monthly interval elapses
2. **Chainlink VRF** is called to generate a provably random number for fair winner selection
3. **Chainlink Data Feeds** provide real-time ETH/USD pricing to value collateral in USD and adjust collateral multipliers (125% normal, 150% if feed is stale)
4. **Chainlink Functions** fetches live DeFi APY data from DeFiLlama via the Chainlink DON, updating the YieldOptimizer with verified on-chain rates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth | Privy (Email/Google/Wallet) + Coinbase Smart Wallet |
| On-chain | Solidity 0.8.20, Hardhat, Base Sepolia |
| Oracle | Chainlink VRF, Automation, Data Feeds, Functions |
| DeFi | Coinbase AgentKit, DeFiLlama API |
| Gas | Coinbase Paymaster (sponsored transactions) |
| NFT | Soulbound ERC721 Reputation Token |
| UI Kit | OnchainKit, Farcaster MiniKit |

## Smart Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| IDRX Token | [`0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD`](https://sepolia.basescan.org/address/0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD#code) |
| ArminaPool | [`0x68CA47998CD6Ea7F32daCf7B5e682F25cd487E80`](https://sepolia.basescan.org/address/0x68CA47998CD6Ea7F32daCf7B5e682F25cd487E80#code) |
| ArminaYieldOptimizer | [`0x2A6A74A5be9db960eeEF4762304A5aD58aF66059`](https://sepolia.basescan.org/address/0x2A6A74A5be9db960eeEF4762304A5aD58aF66059#code) |
| ArminaReputation (Soulbound NFT) | [`0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B`](https://sepolia.basescan.org/address/0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B#code) |
| ArminaAutomation | [`0xa1cD2242Df6312bA3E9D803c53f0d13f018fEC5D`](https://sepolia.basescan.org/address/0xa1cD2242Df6312bA3E9D803c53f0d13f018fEC5D#code) |
| ArminaFunctions | [`0x692c59D534e0EbFE3827a1469154511734219BBb`](https://sepolia.basescan.org/address/0x692c59D534e0EbFE3827a1469154511734219BBb#code) |

All contracts are verified and open-source on Basescan.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install & Run

```bash
# Clone
git clone https://github.com/yt2025id-lab/Armina.git
cd Armina

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Fill in your keys (see .env.example for details)

# Run development server
npm run dev
```

Open http://localhost:3000

### Smart Contract Development

```bash
# Compile contracts
npm run compile

# Run tests (93 tests)
npm test

# Deploy all contracts to Base Sepolia
npx hardhat run scripts/deploy-chainlink-upgrade.ts --network baseSepolia

# Deploy individually
npm run deploy:idrx
npm run deploy:pool
npm run deploy:reputation

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS>
```

### Chainlink Setup

```bash
# VRF: Create subscription at https://vrf.chain.link/base-sepolia
# Automation: Register upkeep at https://automation.chain.link/base-sepolia
# Functions: Create subscription at https://functions.chain.link/base-sepolia
```

## Project Structure

```
contracts/                    # Solidity smart contracts
  ArminaPool.sol              # Main pool (collateral, VRF, Data Feed, automation)
  ArminaYieldOptimizer.sol    # AI yield optimizer (multi-protocol DeFi deployment)
  ArminaAutomation.sol        # Chainlink Automation (scheduled draws & harvests)
  ArminaFunctions.sol         # Chainlink Functions (DeFiLlama APY via DON)
  ArminaReputation.sol        # Soulbound reputation NFT (score, levels, discounts)
  IDRX.sol                    # Mock IDRX ERC20 token (500K faucet, unlimited claims)
  mocks/                      # Test mocks (MockAggregatorV3, VRFCoordinatorV2Mock)
scripts/                      # Deployment & setup scripts
test/                         # Hardhat tests (93 tests)
src/
  app/                        # Next.js pages
    page.tsx                  # Home — wallet, balance, pool stats
    pool/                     # Pool listing — browse & join pools
    pools/[id]/               # Pool detail — real-time pool data
    dashboard/                # Dashboard — payments, collateral, yield
    optimizer/                # AI Yield Optimizer — live DeFi rates
    chainlink/                # Chainlink Integration Dashboard — all 4 products
    profil/                   # Profile — balances, reputation, faucet
    peringkat/                # Ranking — reputation leaderboard
    faucet/                   # IDRX faucet — claim test tokens
    api/yields/               # API — live DeFi yield data from DeFiLlama
  hooks/                      # React hooks
    usePoolData.ts            # On-chain pool reads (multicall)
    useArminaPool.ts          # Pool write operations
    useIDRX.ts                # IDRX balance & faucet
    useReputation.ts          # Reputation NFT hooks
    useYieldData.ts           # Live yield data from AI agent API
    usePaymaster.ts           # Coinbase Paymaster for gasless transactions
    useAutomation.ts          # Chainlink Automation status & countdown
    usePriceFeed.ts           # Chainlink Data Feed — ETH/USD price
    useFunctions.ts           # Chainlink Functions — APY requests
  contracts/                  # ABIs & config
  components/                 # UI components
  lib/                        # Constants, utilities, wagmi config
```

## AI Yield Optimizer

The ArminaYieldOptimizer smart contract deploys idle collateral to the highest-yielding DeFi protocol on Base. An off-chain AI agent monitors APYs via DeFiLlama and calls `rebalance()` to move funds when a better opportunity is found.

**On-chain (ArminaYieldOptimizer.sol):**
- Collateral auto-deployed to best protocol when pool starts
- AI agent triggers rebalance across protocols
- Yield harvested and distributed proportionally to pool participants
- Emergency withdrawal by owner
- Chainlink Functions can also update APY data via decentralized DON

**Off-chain AI agent:**
- DeFiLlama yields API for live APY data (free, no key required)
- Risk-adjusted scoring: TVL, protocol reputation, APY sustainability
- Coinbase AgentKit (`@coinbase/agentkit`) for on-chain execution

**Supported protocols:** Moonwell, Aave V3, Compound V3, Morpho, Seamless

**Default APYs (basis points):** Morpho 1400 (14%), Moonwell 1250 (12.5%), Seamless 1200 (12%), Aave 1100 (11%), Compound 1050 (10.5%)

## Soulbound Reputation NFT

On-chain credit scoring system using a non-transferable ERC721 token.

| Level | Score | Collateral Discount |
|-------|-------|-------------------|
| Bronze | 0–99 | 0% |
| Silver | 100–299 | 10% |
| Gold | 300–499 | 20% |
| Diamond | 500+ | 25% |

**Score changes:**
- On-time payment: **+10**
- Pool completed: **+50**
- Late payment: **-20**
- Default: **-100**

## Gasless Transactions (Paymaster)

All transactions are sponsored via Coinbase Paymaster — users never need ETH for gas fees. This is powered by Coinbase Developer Platform and works automatically with Coinbase Smart Wallet.

## How It Works

1. **Mint Reputation NFT** — Free soulbound NFT to track your on-chain credit
2. **Choose Pool** — Select size (5/10/15/20 members) and contribution amount
3. **Lock Collateral** — Deposit 125% as commitment + yield capital (discount based on reputation)
4. **Monthly Contributions** — Pay each round, AI optimizes idle funds
5. **Automated Draw** — Chainlink Automation triggers monthly, VRF selects winner
6. **Complete & Settle** — Get collateral back + accumulated yield + reputation score boost

**Penalty:** 10% deducted per missed payment. Chronic defaulters get liquidated.

## Testing

```bash
npm test
```

93 tests covering:
- **ArminaPool (48 tests):** IDRX token, pool creation, joining, payments, settlement, yield optimizer integration, VRF integration, reputation integration, full lifecycle E2E
- **ArminaYieldOptimizer (6 tests):** deployment, best APY selection, pool authorization, APY updates, deposits
- **ArminaReputation (19 tests):** minting, soulbound transfers, pool authorization, score recording, levels & discounts
- **Chainlink Integrations (20 tests):** Data Feeds (price oracle, collateral USD value, dynamic multiplier), Automation (checkUpkeep, performUpkeep, interval management), ArminaPool automation access control, YieldOptimizer Functions caller

## Environment Variables

See [.env.example](.env.example) for all required variables:
- `PRIVATE_KEY` — Deployer wallet
- `BASESCAN_API_KEY` — Contract verification on Basescan
- `NEXT_PUBLIC_ARMINA_POOL_ADDRESS` — ArminaPool contract
- `NEXT_PUBLIC_IDRX_ADDRESS` — IDRX token contract
- `NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS` — ArminaYieldOptimizer contract
- `NEXT_PUBLIC_REPUTATION_ADDRESS` — Reputation NFT contract
- `NEXT_PUBLIC_AUTOMATION_ADDRESS` — ArminaAutomation contract
- `NEXT_PUBLIC_FUNCTIONS_ADDRESS` — ArminaFunctions contract
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — Coinbase Developer Platform (Paymaster)
- `NEXT_PUBLIC_PRIVY_APP_ID` — Privy authentication
- `VRF_SUBSCRIPTION_ID` — Chainlink VRF subscription

## License

MIT

---

*Built for Chainlink Convergence Hackathon 2026*
