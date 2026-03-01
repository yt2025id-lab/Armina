<div align="center">

# ARMINA
### On-Chain Arisan — Rotating Savings Powered by Chainlink CRE

[![Live Demo](https://img.shields.io/badge/Live%20Demo-armina--finance.vercel.app-blue?style=for-the-badge)](https://armina-finance.vercel.app)
[![Network](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?style=for-the-badge&logo=coinbase)](https://sepolia.basescan.org)
[![Chainlink](https://img.shields.io/badge/Chainlink-5%20Products-375BD2?style=for-the-badge&logo=chainlink)](https://chain.link)
[![Tests](https://img.shields.io/badge/Tests-122%20Passing-brightgreen?style=for-the-badge)](#testing)

**Indonesia's $25B rotating savings tradition — trustlessly enforced on-chain.**

[Try Live App](https://armina-finance.vercel.app) · [Watch Demo](submission/03_DEMO_VIDEO_SCRIPT.md) · [View Contracts](#smart-contracts) · [Architecture](#architecture)

</div>

---

## The Problem

**Arisan** is Indonesia's 400-year-old rotating savings system — 87 million participants, $25B in annual flows. A group of friends pool money monthly; each month one member wins the pot. It works on trust.

When trust breaks: organizers disappear with funds, winners drop out after receiving the pot, payments get missed with no recourse. **No smart contract has solved this at scale** — because it requires verifiable randomness, automated scheduling, reliable price data, and cross-chain accessibility. All of which require Chainlink.

---

## The Solution

Armina makes arisan **trustless**. Participants lock collateral before joining. Chainlink enforces every rule automatically — from collateral pricing to winner selection to monthly draws. Nobody can cheat, nobody can disappear.

```
Traditional Arisan                    Armina
─────────────────────                 ──────────────────────────────────────
Trust the organizer         →         Smart contract is the organizer
Manual winner selection     →         Chainlink VRF (provably fair)
WhatsApp payment reminders  →         Chainlink Automation (autonomous draws)
Fixed 100% collateral       →         Chainlink Data Feeds (dynamic 125%–150%)
Closed to your circle       →         Chainlink CCIP (cross-chain joining)
Idle collateral earns 0%    →         Chainlink Functions → DeFi yield (12–14% APY)
```

---

## Why Chainlink Is Essential (Not Optional)

Each of the 5 Chainlink products solves a problem that **cannot be solved otherwise**:

| Chainlink Product | Problem It Solves | Without It |
|---|---|---|
| **VRF V2.5** | Who wins the pot this month? | Organizer can rig the draw |
| **Automation** | Who triggers the monthly draw? | Requires a trusted bot or human |
| **Data Feeds** | How much collateral is $X ETH worth? | Fixed amounts become under/over-collateralized |
| **Functions** | Where should idle collateral earn yield? | Static protocol selection, suboptimal returns |
| **CCIP** | Can users from other chains join? | Siloed to one network, smaller liquidity |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARMINA PROTOCOL                          │
│                                                                 │
│  User (Base Sepolia)          User (Ethereum Sepolia)           │
│       │                              │                          │
│       │ joinPool()                   │ sendCCIPMessage()        │
│       ▼                              ▼                          │
│  ┌─────────────┐          ┌─────────────────┐                  │
│  │  ArminaPool │◄─────────│   ArminaCCIP    │◄── CCIP Router   │
│  │  (core)     │          │   (receiver)    │    Eth Sepolia   │
│  └──────┬──────┘          └─────────────────┘                  │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────┐       │
│  │              Chainlink CRE Orchestration             │       │
│  │                                                      │       │
│  │  [monthly tick]                                      │       │
│  │  Automation.performUpkeep()                          │       │
│  │    ├── Functions.requestAPYUpdate()  ←── DeFiLlama  │       │
│  │    │         └── YieldOptimizer.rebalance()          │       │
│  │    ├── Pool.requestWinnerDraw()                      │       │
│  │    │         └── VRF.requestRandomWords()            │       │
│  │    │                   └── fulfillRandomWords()      │       │
│  │    │                         └── winner selected ✓  │       │
│  │    └── DataFeed.latestRoundData()                   │       │
│  │              └── collateral = f(ETH/USD, freshness) │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────┐           │
│  │  YieldOptimizer     │    │  Reputation (SBT)    │           │
│  │  Moonwell/Aave/     │    │  Bronze→Diamond NFT  │           │
│  │  Compound/Morpho    │    │  Collateral discount │           │
│  └─────────────────────┘    └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chainlink CRE — 5 Products Deep Dive

### 1. VRF V2.5 — Provably Fair Winner Selection

Every monthly draw uses Chainlink VRF V2.5 with `uint256` subscription IDs. No one — not even the contract owner — can predict or manipulate the winner.

```solidity
// ArminaPool.sol
function requestWinnerDraw(uint256 poolId) external returns (uint256 requestId) {
    requestId = vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: 3,
            callbackGasLimit: 200_000,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({ nativePayment: false })
            )
        })
    );
    vrfRequests[requestId] = VRFRequest({ poolId: poolId, round: pool.currentRound });
}

function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
    uint256 winnerIndex = randomWords[0] % pool.currentParticipants;
    address winner = pool.participants[winnerIndex];
    _distributeMonthlyPot(poolId, winner);
}
```

### 2. Automation — Autonomous Monthly Cycle

No cron jobs. No trusted bots. Chainlink Automation monitors all active pools and triggers `performUpkeep()` when a monthly interval elapses — initiating yield harvest, APY refresh, and winner draw atomically.

```solidity
// ArminaAutomation.sol
function checkUpkeep(bytes calldata) external view override
    returns (bool upkeepNeeded, bytes memory performData)
{
    for (uint256 i = 0; i < activePools.length; i++) {
        if (block.timestamp >= pools[i].lastDrawTime + MONTHLY_INTERVAL) {
            return (true, abi.encode(activePools[i]));
        }
    }
}

function performUpkeep(bytes calldata performData) external override {
    uint256 poolId = abi.decode(performData, (uint256));
    arminaFunctions.requestAPYUpdate();       // refresh yield data
    yieldOptimizer.harvestYield(poolId);      // collect DeFi yield
    arminaPool.requestWinnerDraw(poolId);     // trigger VRF draw
}
```

### 3. Data Feeds — Dynamic Collateral Pricing

Collateral requirement adapts to ETH/USD price in real time. A stale feed (>1 hour) automatically raises the requirement from 125% to 150% as a safety mechanism — protecting the pool against price manipulation.

```solidity
// ArminaPool.sol
function getDynamicCollateralMultiplier() public view returns (uint256) {
    (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
    require(price > 0, "Invalid price");
    bool isStale = block.timestamp - updatedAt > STALE_THRESHOLD; // 1 hour
    return isStale ? 150 : 125; // 150% stale, 125% fresh
}
```

### 4. Functions — AI Yield Optimizer via DON

Chainlink Functions executes off-chain JavaScript inside the DON to fetch live APY data from DeFiLlama, then writes the result on-chain. When APY delta exceeds the threshold, it automatically triggers rebalance on `ArminaYieldOptimizer`.

```javascript
// Chainlink Functions source (executed inside DON)
const response = await Functions.makeHttpRequest({
  url: "https://yields.llama.fi/pools",
});
const baseProtocols = response.data.data.filter(p =>
  p.chain === "Base" && TARGET_PROTOCOLS.includes(p.project)
);
const best = baseProtocols.sort((a, b) => b.apy - a.apy)[0];
return Functions.encodeString(`${best.project}:${Math.round(best.apy * 100)}`);
```

```solidity
// ArminaFunctions.sol
function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory) internal override {
    (string memory protocol, uint256 apyBps) = _parseResponse(response);
    if (_apyDeltaExceedsThreshold(apyBps)) {
        yieldOptimizer.rebalance(protocol, apyBps); // auto-rebalance
    }
}
```

### 5. CCIP — Cross-Chain Pool Joining

Users on Ethereum Sepolia can join Armina pools on Base Sepolia without bridging. CCIP delivers the join message, and `ArminaCCIP` calls `joinPoolFor()` on `ArminaPool`. Source chain and sender allowlisting prevent unauthorized calls.

```solidity
// ArminaCCIP.sol
function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    require(allowlistedSourceChains[message.sourceChainSelector], "Chain not allowed");
    (uint256 poolId, address participant) = abi.decode(message.data, (uint256, address));
    arminaPool.joinPoolFor(poolId, participant); // register cross-chain user
}
```

---

## User Journey

```
1. Connect Wallet (Privy / Coinbase Smart Wallet)
        │
2. Claim IDRX from Faucet (500K IDRX testnet)
        │
3. Mint Reputation NFT (free, soulbound)
        │
4. Browse Pools → Select Tier
   ├── Small Pool   100K IDRX/month  (3–5 members)
   ├── Medium Pool  500K IDRX/month  (5–10 members)
   └── Large Pool    1M IDRX/month  (10–20 members)
        │
5. Lock Collateral + First Payment
   └── 125% × (members × contribution) — dynamic via Data Feeds
   └── Reputation Diamond? → 25% discount on collateral
        │
6. AI Yield Optimizer deploys idle collateral to best DeFi protocol
   └── Chainlink Functions fetches APY from DeFiLlama via DON
   └── Auto-rebalances: Morpho 14% → Moonwell 12.5% → Aave 11%
        │
7. Monthly: Chainlink Automation triggers draw
   └── VRF selects provably random winner
   └── Winner receives full monthly pot
   └── Reputation score updated on-chain
        │
8. Pool Completes → Collateral returned + yield earned
```

---

## Smart Contracts

> All contracts verified on Basescan. New deployment with full Chainlink CRE.

| Contract | Address | Basescan |
|----------|---------|----------|
| **ArminaPool** | `0xeF490B63A0b15618f437C5b7BA774146Dc3213A3` | [View](https://sepolia.basescan.org/address/0xeF490B63A0b15618f437C5b7BA774146Dc3213A3#code) |
| **IDRX Token** | `0x7F197979D4046b2264De80D11359B6Cb5d1a8611` | [View](https://sepolia.basescan.org/address/0x7F197979D4046b2264De80D11359B6Cb5d1a8611#code) |
| **ArminaYieldOptimizer** | `0xA29B86204f0Dd052922C6417bceECd7554e5BC9a` | [View](https://sepolia.basescan.org/address/0xA29B86204f0Dd052922C6417bceECd7554e5BC9a#code) |
| **ArminaReputation** | `0xb4D23587F855C54E558d1a3d630Be53bdAEe16de` | [View](https://sepolia.basescan.org/address/0xb4D23587F855C54E558d1a3d630Be53bdAEe16de#code) |
| **ArminaAutomation** | `0x2f4298770BbAa71624154d29126BB863014Dbf41` | [View](https://sepolia.basescan.org/address/0x2f4298770BbAa71624154d29126BB863014Dbf41#code) |
| **ArminaFunctions** | `0x3502eb7116805f7220D7D654ab3c69e5ce328193` | [View](https://sepolia.basescan.org/address/0x3502eb7116805f7220D7D654ab3c69e5ce328193#code) |
| **ArminaCCIP** | `0x269f7d9701777a1Ab676a0129b1F058140776e83` | [View](https://sepolia.basescan.org/address/0x269f7d9701777a1Ab676a0129b1F058140776e83#code) |

### Chainlink Service Configuration

| Service | Config |
|---------|--------|
| VRF V2.5 | Coordinator `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE` · Sub funded · 1 consumer |
| Data Feeds | ETH/USD `0x4aDC67D2Ff1e548cE5eBb4B89AA5B3e76509A6b5` · Base Sepolia |
| Functions | Router `0xf9B8fc078197181C841c296C876945aaa425B278` · Sub 577 · 1 consumer |
| Automation | "Armina Monthly Cycle" · Custom logic · Active upkeep |
| CCIP | Router `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` · Eth Sepolia → Base Sepolia |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| Oracle / CRE | Chainlink VRF V2.5, Automation, Data Feeds, Functions, CCIP |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, wagmi v2 |
| Auth | Privy (Email / Google / Wallet) + Coinbase Smart Wallet |
| Gas | Coinbase Paymaster — gasless for users |
| DeFi | Moonwell, Aave V3, Compound V3, Morpho, Seamless |
| Yield Data | DeFiLlama API via Chainlink Functions DON |
| UI Kit | OnchainKit, Farcaster MiniKit |
| Token | IDRX — IDR-pegged stablecoin |

---

## Testing

122+ tests covering every Chainlink integration:

```bash
npm test
```

| Suite | Tests | Coverage |
|-------|-------|---------|
| ArminaPool | 48 | Pool lifecycle, collateral, payments, settlement |
| Chainlink CRE | 34 | VRF draw, Automation upkeep, Functions APY, Data Feeds |
| ArminaReputation | 19 | SBT mint, scoring, levels, collateral discounts |
| ArminaCCIP | 15 | Cross-chain joins, source allowlist, security |
| ArminaYieldOptimizer | 6 | Protocol selection, deposits, APY ranking |

---

## Run Locally

```bash
git clone https://github.com/yt2025id-lab/Armina.git
cd Armina
npm install
cp .env.example .env.local
# Fill in your keys (see .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy Contracts

```bash
# Compile
npm run compile

# Deploy full Chainlink CRE stack to Base Sepolia
npx hardhat run scripts/setup-chainlink-live.ts --network baseSepolia

# Setup Functions + CCIP + link all contracts
npx hardhat run scripts/continue-setup.ts --network baseSepolia

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS>
```

### Post-Deploy Chainlink Setup

1. **VRF** → [vrf.chain.link/base-sepolia](https://vrf.chain.link/base-sepolia) — create sub, add ArminaPool as consumer, fund LINK
2. **Functions** → [functions.chain.link/base-sepolia](https://functions.chain.link/base-sepolia) — create sub, add ArminaFunctions, fund LINK, call `setSubscriptionId()`
3. **Automation** → [automation.chain.link/base-sepolia](https://automation.chain.link/base-sepolia) — register ArminaAutomation as custom logic upkeep
4. **Data Feeds** — built-in, no setup needed
5. **CCIP** — deployed automatically, Ethereum Sepolia source chain pre-allowed

---

## Project Structure

```
contracts/
├── ArminaPool.sol              # Core — collateral, VRF, Data Feeds, CCIP receiver
├── ArminaYieldOptimizer.sol    # AI yield optimizer (Moonwell/Aave/Compound/Morpho)
├── ArminaAutomation.sol        # Chainlink Automation — monthly cycle orchestrator
├── ArminaFunctions.sol         # Chainlink Functions — DeFiLlama APY + auto-rebalance
├── ArminaCCIP.sol              # Chainlink CCIP — cross-chain pool joining
├── ArminaReputation.sol        # Soulbound reputation NFT
└── IDRX.sol                    # IDR-pegged ERC20 token with faucet

src/
├── app/
│   ├── pool/                   # Browse & join pools
│   ├── pools/[id]/             # Pool detail — real-time data
│   ├── dashboard/              # Payments, collateral, yield tracker
│   ├── optimizer/              # AI Yield Optimizer — live DeFi rates
│   ├── chainlink/              # Chainlink Integration Dashboard
│   ├── profil/                 # Profile, reputation, SBT
│   └── faucet/                 # IDRX test token faucet
├── hooks/                      # wagmi hooks for all contracts
└── contracts/                  # ABIs and contract config

submission/                     # Hackathon submission documents
├── 01_PITCHDECK_CHAINLINK.md   # Chainlink track pitch deck (14 slides)
├── 02_PITCHDECK_BASE.md        # Base track pitch deck
├── 03_DEMO_VIDEO_SCRIPT.md     # Demo video script + voiceover
└── ...                         # Implementation docs
```

---

## Security

| Protection | Implementation |
|------------|----------------|
| Reentrancy | `ReentrancyGuard` on all state-changing functions |
| Safe transfers | OpenZeppelin `SafeERC20` throughout |
| Double-claim | `hasClaimed` flag prevents multiple settlement claims |
| Double-draw | `drawRequested` mapping prevents duplicate VRF requests per round |
| Stale oracle | Data Feeds freshness check → auto-escalates collateral to 150% |
| CCIP security | Source chain + sender allowlisting on `ArminaCCIP` |
| Access control | Owner-only admin, contract-only cross-contract calls |

---

## Soulbound Reputation System

On-chain credit scoring via non-transferable ERC721. Higher reputation = lower collateral required.

| Level | Score | Collateral Discount | How to Earn |
|-------|-------|--------------------|-|
| Bronze | 0–99 | 0% | Default |
| Silver | 100–299 | 10% | Consistent payments |
| Gold | 300–499 | 20% | Multiple completed pools |
| Diamond | 500+ | 25% | Long-term participation |

Score events: on-time payment `+10`, pool completed `+50`, late payment `-20`, default `-100`

---

<div align="center">

**Built for Base Around the World Hackathon 2025 — Chainlink Track**

[armina-finance.vercel.app](https://armina-finance.vercel.app)

</div>
