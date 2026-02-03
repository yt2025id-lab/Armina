# Armina — Arisan on Chain

Decentralized rotating savings (arisan) protocol on Base with 125% collateral enforcement, AI-powered yield optimization, and gasless transactions.

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
- Chainlink VRF — provably fair winner selection
- Mobile-first PWA with bilingual support (EN/ID)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth | Privy (Email/Google/Wallet) + Coinbase Smart Wallet |
| On-chain | Solidity 0.8.20, Hardhat, Base Sepolia |
| DeFi | Coinbase AgentKit, DeFiLlama API |
| Gas | Coinbase Paymaster (sponsored transactions) |
| NFT | Soulbound ERC721 Reputation Token |
| Randomness | Chainlink VRF V2.5 |
| UI Kit | OnchainKit, Farcaster MiniKit |

## Smart Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| IDRX Token | `0x7F197979D4046b2264De80D11359B6Cb5d1a8611` |
| ArminaPool | `0x5DD351Aa364b3E77650daF9eF29EC907eECA30AC` |
| ArminaYieldOptimizer | `0xA29B86204f0Dd052922C6417bceECd7554e5BC9a` |
| ArminaReputation (Soulbound NFT) | `0xb4D23587F855C54E558d1a3d630Be53bdAEe16de` |

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

# Run tests (73 tests)
npm test

# Deploy all contracts to Base Sepolia (ArminaPool + YieldOptimizer)
npx hardhat run scripts/deploy-all.ts --network baseSepolia

# Deploy individually
npm run deploy:idrx
npm run deploy:pool
npm run deploy:reputation

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS>
```

### VRF Setup

```bash
# Configure Chainlink VRF (see script for full instructions)
SUBSCRIPTION_ID=123 npx hardhat run scripts/setup-vrf.ts --network baseSepolia
```

## Project Structure

```
contracts/                # Solidity smart contracts
  ArminaPool.sol          # Main pool contract (collateral, VRF, yield optimizer, reputation)
  ArminaYieldOptimizer.sol# AI yield optimizer (multi-protocol DeFi deployment)
  ArminaReputation.sol    # Soulbound reputation NFT (score, levels, discounts)
  IDRX.sol                # Mock IDRX ERC20 token (500K faucet, 5hr cooldown)
scripts/                  # Deployment & setup scripts
test/                     # Hardhat tests (73 tests)
src/
  app/                    # Next.js pages
    page.tsx              # Home — wallet, balance, pool stats
    pool/                 # Pool listing — browse & join pools
    pools/[id]/           # Pool detail — real-time pool data
    dashboard/            # Dashboard — payments, collateral, yield
    optimizer/            # AI Yield Optimizer — live DeFi rates
    profil/               # Profile — balances, reputation, faucet
    peringkat/            # Ranking — reputation leaderboard
    faucet/               # IDRX faucet — claim test tokens
    api/yields/           # API — live DeFi yield data from DeFiLlama
  hooks/                  # React hooks
    usePoolData.ts        # On-chain pool reads (multicall)
    useArminaPool.ts      # Pool write operations
    useIDRX.ts            # IDRX balance & faucet
    useReputation.ts      # Reputation NFT hooks
    useYieldData.ts       # Live yield data from AI agent API
    usePaymaster.ts       # Coinbase Paymaster for gasless transactions
  contracts/              # ABIs & config
  components/             # UI components
  lib/                    # Constants, utilities, wagmi config
```

## AI Yield Optimizer

The ArminaYieldOptimizer smart contract deploys idle collateral to the highest-yielding DeFi protocol on Base. An off-chain AI agent monitors APYs via DeFiLlama and calls `rebalance()` to move funds when a better opportunity is found.

**On-chain (ArminaYieldOptimizer.sol):**
- Collateral auto-deployed to best protocol when pool starts
- AI agent triggers rebalance across protocols
- Yield harvested and distributed proportionally to pool participants
- Emergency withdrawal by owner

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
5. **Winner Selection** — Chainlink VRF selects payout recipient each round
6. **Complete & Settle** — Get collateral back + accumulated yield + reputation score boost

**Penalty:** 10% deducted per missed payment. Chronic defaulters get liquidated.

## Testing

```bash
npm test
```

73 tests covering:
- **ArminaPool (48 tests):** IDRX token, pool creation, joining, payments, settlement, yield optimizer integration, VRF integration, reputation integration, full lifecycle E2E
- **ArminaYieldOptimizer (6 tests):** deployment, best APY selection, pool authorization, APY updates, deposits
- **ArminaReputation (19 tests):** minting, soulbound transfers, pool authorization, score recording, levels & discounts

## Environment Variables

See [.env.example](.env.example) for all required variables:
- `PRIVATE_KEY` — Deployer wallet
- `NEXT_PUBLIC_ARMINA_POOL_ADDRESS` — ArminaPool contract
- `NEXT_PUBLIC_IDRX_ADDRESS` — IDRX token contract
- `NEXT_PUBLIC_YIELD_OPTIMIZER_ADDRESS` — ArminaYieldOptimizer contract
- `NEXT_PUBLIC_REPUTATION_ADDRESS` — Reputation NFT contract
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — Coinbase Developer Platform (Paymaster)
- `NEXT_PUBLIC_PRIVY_APP_ID` — Privy authentication
- `VRF_SUBSCRIPTION_ID` — Chainlink VRF subscription

## License

MIT

---

*Built for Base Around the World Hackathon 2025 — Indonesia*
