# Armina — Arisan on Chain

Decentralized rotating savings (arisan) protocol on Base with 125% collateral enforcement and AI-powered yield optimization.

**Live Demo:** https://armina-finance.vercel.app
**Network:** Base Sepolia Testnet

## What is Armina?

Armina brings Indonesia's traditional rotating savings system (arisan) on-chain. Participants form pools, contribute monthly, and take turns receiving the full pot — all enforced by smart contracts with collateral protection.

**Key Features:**
- 125% collateral enforcement — eliminates default risk
- AI Yield Optimizer — idle collateral earns yield via DeFi protocols (Moonwell, Aave, Compound)
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
| Randomness | Chainlink VRF V2.5 |
| UI Kit | OnchainKit, Farcaster MiniKit |

## Smart Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| IDRX Token | `0x7F197979D4046b2264De80D11359B6Cb5d1a8611` |
| ArminaPool | `0xDdBFEBA307151a1991b68D31D9e6041852302fB7` |

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

# Run tests (21 tests)
npm test

# Deploy to Base Sepolia
npm run deploy:idrx
npm run deploy:pool

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### VRF Setup

```bash
# Configure Chainlink VRF (see script for full instructions)
SUBSCRIPTION_ID=123 npx hardhat run scripts/setup-vrf.ts --network baseSepolia
```

## Project Structure

```
contracts/          # Solidity smart contracts
  ArminaPool.sol    # Main pool contract (multi-pool, collateral, VRF)
  IDRX.sol          # Mock IDRX ERC20 token with faucet
scripts/            # Deployment & setup scripts
test/               # Hardhat tests (21 tests)
src/
  app/              # Next.js pages
    page.tsx        # Home — wallet, balance, pool stats
    pool/           # Pool listing — browse & join pools
    pools/[id]/     # Pool detail — real-time pool data
    dashboard/      # Dashboard — payments, collateral, yield
    optimizer/      # AI Yield Optimizer — live DeFi rates
    profil/         # Profile — balances, reputation, faucet
    peringkat/      # Ranking — reputation leaderboard
    faucet/         # IDRX faucet — claim test tokens
    api/yields/     # API — live DeFi yield data from DeFiLlama
  hooks/            # React hooks
    usePoolData.ts  # On-chain pool reads (multicall)
    useArminaPool.ts # Pool write operations
    useIDRX.ts      # IDRX balance & faucet
    useReputation.ts # Reputation NFT hooks
    useYieldData.ts # Live yield data from AI agent API
  contracts/        # ABIs & config
  components/       # UI components (24 total)
  lib/              # Constants, utilities, wagmi config
```

## AI Yield Optimizer

The optimizer fetches live APY data from DeFiLlama for Base chain stablecoin pools, ranks them using a risk-adjusted scoring algorithm, and recommends the best protocol for collateral deployment.

**Powered by:**
- Coinbase AgentKit (`@coinbase/agentkit`)
- DeFiLlama yields API (free, no key required)
- Risk scoring: TVL, protocol reputation, APY sustainability

**Supported protocols:** Moonwell, Aave V3, Compound V3, Morpho, Seamless

## How It Works

1. **Choose Pool** — Select size (5/10/15/20 members) and contribution amount
2. **Lock Collateral** — Deposit 125% as commitment + yield capital
3. **Monthly Contributions** — Pay each round, AI optimizes idle funds
4. **Winner Selection** — Chainlink VRF selects payout recipient each round
5. **Complete & Settle** — Get collateral back + accumulated yield

**Penalty:** 10% deducted per missed payment. Chronic defaulters get liquidated.

## Testing

```bash
npm test
```

21 tests covering:
- IDRX token (deploy, faucet, decimals)
- Pool creation (validation, events, collateral calculation)
- Joining pools (payment, double-join prevention, auto-start)
- Monthly payments (processing, duplicate rejection, access control)
- View functions & settlement

## Environment Variables

See [.env.example](.env.example) for all required variables:
- `PRIVATE_KEY` — Deployer wallet
- `NEXT_PUBLIC_ARMINA_POOL_ADDRESS` — ArminaPool contract
- `NEXT_PUBLIC_IDRX_ADDRESS` — IDRX token contract
- `NEXT_PUBLIC_CDP_PROJECT_ID` — Coinbase Developer Platform
- `VRF_SUBSCRIPTION_ID` — Chainlink VRF subscription

## License

MIT

---

*Built for Base Around the World Hackathon 2025*
