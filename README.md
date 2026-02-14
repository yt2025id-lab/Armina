# Armina — Arisan on Chain

Decentralized rotating savings (arisan) protocol on Base with **5 Chainlink products** orchestrated as a Chainlink Runtime Environment (CRE) — VRF for fair randomness, Automation for scheduled draws, Data Feeds for collateral pricing, Functions for verified DeFi yields, and CCIP for cross-chain pool joining.

**Live Demo:** https://armina-finance.vercel.app
**Network:** Base Sepolia Testnet

## What is Armina?

Armina brings Indonesia's traditional rotating savings system (arisan) on-chain. Participants form pools, contribute monthly, and take turns receiving the full pot — all enforced by smart contracts with collateral protection.

**Key Features:**
- Dynamic collateral (125%–150%) enforced by Chainlink Data Feeds
- AI Yield Optimizer — idle collateral earns yield via DeFi protocols (Moonwell, Aave, Compound)
- Soulbound Reputation NFT — on-chain credit scoring with collateral discounts
- Cross-chain pool joining via Chainlink CCIP (Ethereum Sepolia → Base Sepolia)
- Coinbase Paymaster — gasless transactions, users pay zero gas fees
- IDRX stablecoin — IDR-pegged token for familiar value
- Mobile-first PWA with bilingual support (EN/ID)

## Chainlink CRE Integration — 5 Products

Armina uses **5 Chainlink products** working together as a unified Chainlink Runtime Environment (CRE). All products are orchestrated in a single monthly cycle:

```
Automation.performUpkeep()
  |-> Functions.requestAPYUpdate()     [refresh APY via DON]
  |-> Optimizer.harvestYield()         [collect DeFi yield]
  |-> Pool.requestWinnerDraw()         [trigger VRF random draw]
       |-> Data Feeds enforces dynamic collateral on next joinPool
       |-> CCIP enables cross-chain joining from Ethereum Sepolia
```

| # | Chainlink Product | Contract | Usage |
|---|-------------------|----------|-------|
| 1 | **VRF V2.5** | ArminaPool | Provably fair random winner selection each round |
| 2 | **Automation** | ArminaAutomation | Autonomous monthly draws, yield harvest & APY refresh |
| 3 | **Data Feeds** | ArminaPool | ETH/USD price oracle for dynamic collateral (125% fresh, 150% stale) |
| 4 | **Functions** | ArminaFunctions | Off-chain APY data from DeFiLlama via DON + auto-rebalance |
| 5 | **CCIP** | ArminaCCIP | Cross-chain pool joining from Ethereum Sepolia to Base Sepolia |

### How CRE Works in Armina

1. **Chainlink Automation** monitors all active pools and triggers `performUpkeep()` when a monthly interval elapses. It also calls Functions to refresh APY data before each cycle.
2. **Chainlink Functions** fetches live DeFi APY data from DeFiLlama via the Chainlink DON. When APY changes exceed the threshold, it automatically triggers rebalance on the YieldOptimizer.
3. **Chainlink VRF V2.5** generates a provably random number for fair winner selection using `uint256` subscription IDs.
4. **Chainlink Data Feeds** provide real-time ETH/USD pricing to enforce dynamic collateral multipliers — 125% when the feed is fresh, 150% when stale (>1 hour).
5. **Chainlink CCIP** enables users on Ethereum Sepolia to join pools on Base Sepolia via cross-chain messages. The `ArminaCCIP` receiver calls `joinPoolFor()` on `ArminaPool`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Auth | Privy (Email/Google/Wallet) + Coinbase Smart Wallet |
| On-chain | Solidity 0.8.20, Hardhat, Base Sepolia |
| Oracle | Chainlink VRF V2.5, Automation, Data Feeds, Functions, CCIP |
| DeFi | Coinbase AgentKit, DeFiLlama API |
| Gas | Coinbase Paymaster (sponsored transactions) |
| NFT | Soulbound ERC721 Reputation Token |
| UI Kit | OnchainKit, Farcaster MiniKit |

## Smart Contracts (Base Sepolia)

| Contract | Address | Verified |
|----------|---------|----------|
| IDRX Token | [`0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD`](https://sepolia.basescan.org/address/0xd7712a13AB95Ab7F3AfeB3eEc4125dE18D219eeD#code) | Yes |
| ArminaPool | [`0xB6aceB8060CC2CfA2Af0849c2f76838833ce06E3`](https://sepolia.basescan.org/address/0xB6aceB8060CC2CfA2Af0849c2f76838833ce06E3#code) | Yes |
| ArminaYieldOptimizer | [`0x1b0007d0aACDDf08F9b32eAa431D141c33891031`](https://sepolia.basescan.org/address/0x1b0007d0aACDDf08F9b32eAa431D141c33891031#code) | Yes |
| ArminaReputation (Soulbound NFT) | [`0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B`](https://sepolia.basescan.org/address/0x6a7ff47bA8633F252d28F9D6F080fd8cf50ddF6B#code) | Yes |
| ArminaAutomation | [`0x2f4298770BbAa71624154d29126BB863014Dbf41`](https://sepolia.basescan.org/address/0x2f4298770BbAa71624154d29126BB863014Dbf41#code) | Yes |
| ArminaFunctions | [`0x3502eb7116805f7220D7D654ab3c69e5ce328193`](https://sepolia.basescan.org/address/0x3502eb7116805f7220D7D654ab3c69e5ce328193#code) | Yes |
| ArminaCCIP | [`0x269f7d9701777a1Ab676a0129b1F058140776e83`](https://sepolia.basescan.org/address/0x269f7d9701777a1Ab676a0129b1F058140776e83#code) | Yes |

All contracts are verified and open-source on Basescan.

### Chainlink Service Configuration

| Service | Detail |
|---------|--------|
| VRF V2.5 | Coordinator `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`, 1 consumer, funded |
| Data Feeds | ETH/USD `0x4aDC67D2Ff1e548cE5eBb4B89AA5B3e76509A6b5` |
| Functions | Router `0xf9B8fc078197181C841c296C876945aaa425B278`, Sub 577, 1 consumer |
| Automation | "Armina Monthly Cycle" upkeep, custom logic trigger, active |
| CCIP | Router `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`, Eth Sepolia allowed |

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

# Run tests (122+ tests)
npm test

# Deploy all contracts to Base Sepolia
npx hardhat run scripts/setup-chainlink-live.ts --network baseSepolia

# Continue setup (deploy Functions + CCIP, link contracts)
npx hardhat run scripts/continue-setup.ts --network baseSepolia

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS>
```

### Chainlink Setup

After deployment, configure each Chainlink service:

1. **VRF** — Create subscription at https://vrf.chain.link/base-sepolia, add ArminaPool as consumer, fund with LINK
2. **Functions** — Create subscription at https://functions.chain.link/base-sepolia, add ArminaFunctions as consumer, fund with LINK, call `setSubscriptionId()`
3. **Automation** — Register custom logic upkeep at https://automation.chain.link/base-sepolia with ArminaAutomation address
4. **Data Feeds** — Built-in, no separate setup needed
5. **CCIP** — Contract deployed automatically, Ethereum Sepolia source chain allowed

## Project Structure

```
contracts/                    # Solidity smart contracts
  ArminaPool.sol              # Main pool (collateral, VRF V2.5, Data Feed, CCIP joinPoolFor)
  ArminaYieldOptimizer.sol    # AI yield optimizer (multi-protocol DeFi deployment)
  ArminaAutomation.sol        # Chainlink Automation (scheduled draws, harvests & APY refresh)
  ArminaFunctions.sol         # Chainlink Functions (DeFiLlama APY via DON + auto-rebalance)
  ArminaCCIP.sol              # Chainlink CCIP (cross-chain pool joining receiver)
  ArminaReputation.sol        # Soulbound reputation NFT (score, levels, discounts)
  IDRX.sol                    # Mock IDRX ERC20 token (500K faucet, unlimited claims)
  ccip/CCIPInterfaces.sol     # CCIP interfaces (Client, IRouterClient, CCIPReceiver)
  mocks/                      # Test mocks (MockAggregatorV3, VRFCoordinatorV2_5Mock, MockCCIPRouter)
scripts/                      # Deployment & setup scripts
test/                         # Hardhat tests (122+ tests)
src/
  app/                        # Next.js pages
    page.tsx                  # Home — wallet, balance, pool stats
    pool/                     # Pool listing — browse & join pools
    pools/[id]/               # Pool detail — real-time pool data
    dashboard/                # Dashboard — payments, collateral, yield
    optimizer/                # AI Yield Optimizer — live DeFi rates
    chainlink/                # Chainlink Integration Dashboard — all 5 products
    profil/                   # Profile — balances, reputation, faucet
    peringkat/                # Ranking — reputation leaderboard
    faucet/                   # IDRX faucet — claim test tokens
    api/yields/               # API — live DeFi yield data from DeFiLlama
  hooks/                      # React hooks
    usePoolData.ts            # On-chain pool reads (multicall)
    useArminaPool.ts          # Pool write operations (paymaster-aware)
    usePool.ts                # Individual pool hooks (create, join, pay, claim)
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

The ArminaYieldOptimizer smart contract deploys idle collateral to the highest-yielding DeFi protocol on Base. Chainlink Functions fetches APY data from DeFiLlama via the DON, and auto-rebalances when rates change significantly.

**On-chain (ArminaYieldOptimizer.sol):**
- Collateral auto-deployed to best protocol when pool starts
- Chainlink Functions triggers rebalance when APY delta exceeds threshold
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
| Bronze | 0-99 | 0% |
| Silver | 100-299 | 10% |
| Gold | 300-499 | 20% |
| Diamond | 500+ | 25% |

**Score changes:**
- On-time payment: **+10**
- Pool completed: **+50**
- Late payment: **-20**
- Default: **-100**

## Cross-Chain Pool Joining (CCIP)

Users on Ethereum Sepolia can join Armina pools on Base Sepolia via Chainlink CCIP:

1. User sends CCIP message from Ethereum Sepolia with `(poolId, participant, amount)`
2. CCIP Router delivers message to `ArminaCCIP` on Base Sepolia
3. `ArminaCCIP` calls `ArminaPool.joinPoolFor(poolId, participant)` to register the user
4. Security: only allowed source chains and senders can trigger joins

## Gasless Transactions (Paymaster)

All transactions are sponsored via Coinbase Paymaster — users never need ETH for gas fees. This is powered by Coinbase Developer Platform and works automatically with Coinbase Smart Wallet.

## How It Works

1. **Mint Reputation NFT** — Free soulbound NFT to track your on-chain credit
2. **Choose Pool** — Select size (5/10/15/20 members) and contribution amount
3. **Lock Collateral** — Deposit 125-150% as commitment + yield capital (dynamic based on Data Feeds, discount based on reputation)
4. **Monthly Contributions** — Pay each round, AI optimizes idle funds
5. **Automated Draw** — Chainlink Automation triggers monthly, Functions refreshes APY, VRF selects winner
6. **Complete & Settle** — Get collateral back + accumulated yield + reputation score boost

**Penalty:** 10% deducted per missed payment. Chronic defaulters get liquidated.

## Security

- **SafeERC20** — All token transfers use OpenZeppelin SafeERC20 to prevent silent failures
- **ReentrancyGuard** — Protected against reentrancy attacks
- **Double-claim protection** — `hasClaimed` flag prevents multiple settlement claims
- **Double-draw protection** — `drawRequested` mapping prevents duplicate VRF requests per round
- **Access control** — Owner-only admin functions, contract-only cross-contract calls
- **Dynamic collateral** — Stale price feed automatically increases collateral requirement to 150%

## Testing

```bash
npm test
```

122+ tests covering:
- **ArminaPool (48 tests):** IDRX token, pool creation, joining, payments, settlement, yield optimizer integration, VRF V2.5 integration, reputation integration, full lifecycle E2E
- **ArminaYieldOptimizer (6 tests):** deployment, best APY selection, pool authorization, APY updates, deposits
- **ArminaReputation (19 tests):** minting, soulbound transfers, pool authorization, score recording, levels & discounts
- **Chainlink CRE (34 tests):** Data Feeds (price oracle, collateral USD value, dynamic multiplier), Automation (checkUpkeep, performUpkeep, interval management, Functions trigger), Functions (APY update, auto-rebalance, threshold), VRF V2.5 (random draw, fulfillment)
- **ArminaCCIP (15 tests):** deployment, source chain allowlist, sender authorization, cross-chain joins, token recovery

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
- `NEXT_PUBLIC_CCIP_ADDRESS` — ArminaCCIP contract
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` — Coinbase Developer Platform (Paymaster)
- `NEXT_PUBLIC_PRIVY_APP_ID` — Privy authentication
- `VRF_SUBSCRIPTION_ID` — Chainlink VRF subscription

## License

MIT

---

*Built for Chainlink Convergence Hackathon 2026*
