<div align="center">

# ARMINA
### On-Chain Arisan — Indonesia's $25B Rotating Savings, Trustlessly Enforced by Chainlink

[![Live App](https://img.shields.io/badge/Live%20App-armina--theta.vercel.app-blue?style=for-the-badge)](https://armina-theta.vercel.app)
[![Network](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF?style=for-the-badge&logo=coinbase)](https://sepolia.basescan.org)
[![Chainlink](https://img.shields.io/badge/Chainlink-5%20Products%20Deployed-375BD2?style=for-the-badge&logo=chainlink)](https://chain.link)
[![Tests](https://img.shields.io/badge/Tests-122%20Passing-brightgreen?style=for-the-badge)](#testing)

**87 million participants. $25B annual flows. Zero smart contract enforcement — until now.**

[Try Live App](https://armina-theta.vercel.app) · [Watch Demo](https://drive.google.com/file/d/1P0V0APVd-yRne7h8MVXJ0FcwWXefpM2H/view?usp=drive_link) · [Watch Intro](https://drive.google.com/file/d/1G4OeHmQV_tOIryMhKjbhYkJ-qIhUiqut/view?usp=drive_link) · [Pitch Deck & Videos](https://drive.google.com/drive/folders/131CwIqH94TDmkFcJ_eIiUGrWHekmcajY) · [View Contracts](#smart-contracts) · [Architecture](#architecture)

</div>

---

## For Judges — 5-Minute Checklist

> Everything you need to verify, in the order that matters most.

| # | What to Check | Where |
|---|---|---|
| 1 | **Live app working** — connect wallet, claim IDRX, join a pool | [armina-theta.vercel.app](https://armina-theta.vercel.app) |
| 2 | **All 5 Chainlink products** explained with real deployed code | [Chainlink Deep Dive](#chainlink-cre--5-products-deployed--live) |
| 3 | **7 contracts verified on Basescan** | [Smart Contracts](#smart-contracts) |
| 4 | **122 tests** covering every Chainlink integration | [Testing](#testing) · `npm test` |
| 5 | **Pitch deck + demo video** | [Google Drive](https://drive.google.com/drive/folders/131CwIqH94TDmkFcJ_eIiUGrWHekmcajY) |
| 6 | **Submission documents** (architecture, user flow, deployment guide) | [`submission/`](./submission/) |

---

## The Problem

**Arisan** is Indonesia's 400-year-old rotating savings club — a group pools money monthly, and each month one member wins the full pot. 87 million Indonesians participate. $25 billion flows through arisan annually. It runs entirely on social trust.

When trust breaks, there is no recourse:
- Organizers disappear with the collected funds
- Winners stop paying after receiving the pot
- Payments are missed with no enforcement mechanism
- No transparency, no audit trail, no collateral

**No smart contract has solved this at scale** — because arisan requires five capabilities simultaneously: verifiable randomness, autonomous scheduling, dynamic collateral pricing, yield optimization, and cross-chain accessibility. Each one, alone, requires Chainlink.

---

## The Solution

Armina eliminates the trust requirement entirely. Participants lock collateral before joining. Every rule — winner selection, monthly draws, collateral pricing, yield deployment — is enforced by Chainlink automatically. No organizer. No trust. No exceptions.

```
Traditional Arisan                    Armina
─────────────────────                 ──────────────────────────────────────
Trust the organizer         →         Smart contract is the organizer
Manual winner selection     →         Chainlink VRF V2.5 (provably fair)
WhatsApp payment reminders  →         Chainlink Automation (autonomous draws)
Fixed collateral, no pricing →        Chainlink Data Feeds (dynamic 125%–150%)
Closed to your local circle →         Chainlink CCIP (cross-chain joining)
Idle collateral earns 0%    →         Chainlink Functions → DeFi yield (12–14% APY)
```

---

## Why Chainlink Is Essential (Not Optional)

Each product solves a problem **that cannot be solved without it**. Remove any one, and the protocol breaks.

| Chainlink Product | The Problem It Solves | What Breaks Without It |
|---|---|---|
| **VRF V2.5** | Who wins the pot this month? | Organizer or contract owner can rig the draw |
| **Automation** | Who triggers the monthly draw? | Requires a trusted bot — single point of failure |
| **Data Feeds** | How much collateral does 125% of the pot equal in ETH? | Fixed amounts become dangerously under-collateralized as ETH price moves |
| **Functions** | Which DeFi protocol offers the best yield right now? | Static protocol selection — users earn suboptimal returns |
| **CCIP** | Can a user on Ethereum join a pool on Base? | Protocol siloed to one chain, orders of magnitude smaller addressable market |

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

## Chainlink CRE — 5 Products Deployed & Live

### 1. VRF V2.5 — Provably Fair Winner Selection

Every monthly pot draw uses Chainlink VRF V2.5 with `uint256` subscription IDs (the latest standard). No one — including the contract deployer — can predict or influence the winner. The randomness is verifiable on-chain by anyone.

```solidity
// contracts/ArminaPool.sol
function requestWinnerDraw(uint256 poolId) external returns (uint256 requestId) {
    requestId = vrfCoordinator.requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: 3,       // wait 3 blocks for finality
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

No cron jobs. No trusted bots. No human intervention. Chainlink Automation monitors all active pools and triggers `performUpkeep()` the moment a monthly interval elapses — atomically initiating yield harvest, APY refresh, and winner draw in a single transaction.

```solidity
// contracts/ArminaAutomation.sol
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
    arminaFunctions.requestAPYUpdate();       // refresh yield data via DON
    yieldOptimizer.harvestYield(poolId);      // collect DeFi yield
    arminaPool.requestWinnerDraw(poolId);     // trigger VRF draw
}
```

### 3. Data Feeds — Dynamic Collateral Pricing

Collateral requirement adjusts to ETH/USD price in real time. A stale feed (>1 hour) automatically escalates the multiplier from 125% to 150% — protecting participants against oracle manipulation attacks. This is checked on every `joinPool()` call.

```solidity
// contracts/ArminaPool.sol
function getDynamicCollateralMultiplier() public view returns (uint256) {
    (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
    require(price > 0, "Invalid price");
    bool isStale = block.timestamp - updatedAt > STALE_THRESHOLD; // 1 hour
    return isStale ? 150 : 125; // escalate to 150% if feed is stale
}
```

### 4. Functions — AI Yield Optimizer via DON

Chainlink Functions runs off-chain JavaScript inside the Decentralized Oracle Network to fetch live APY data from DeFiLlama across 10 DeFi protocols. The result is written on-chain and triggers automatic rebalancing on `ArminaYieldOptimizer` when APY delta exceeds the threshold.

```javascript
// Chainlink Functions source — executed inside DON, not on any single server
const response = await Functions.makeHttpRequest({
  url: "https://yields.llama.fi/pools",
});
const baseProtocols = response.data.data.filter(p =>
  p.chain === "Base" && TARGET_PROTOCOLS.includes(p.project)
);
const best = baseProtocols.sort((a, b) => b.apy - a.apy)[0];
// e.g. returns "moonwell:1247" → 12.47% APY on Moonwell
return Functions.encodeString(`${best.project}:${Math.round(best.apy * 100)}`);
```

```solidity
// contracts/ArminaFunctions.sol
function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory) internal override {
    (string memory protocol, uint256 apyBps) = _parseResponse(response);
    if (_apyDeltaExceedsThreshold(apyBps)) {
        yieldOptimizer.rebalance(protocol, apyBps); // auto-rebalance collateral
    }
}
```

### 5. CCIP — Cross-Chain Pool Joining

Users on Ethereum Sepolia can join Armina pools on Base Sepolia without bridging assets. CCIP delivers the join intent message cross-chain, and `ArminaCCIP` calls `joinPoolFor()` on `ArminaPool`. Source chain allowlisting and sender verification prevent unauthorized cross-chain calls.

```solidity
// contracts/ArminaCCIP.sol
function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    require(allowlistedSourceChains[message.sourceChainSelector], "Chain not allowed");
    require(allowlistedSenders[abi.decode(message.sender, (address))], "Sender not allowed");
    (uint256 poolId, address participant) = abi.decode(message.data, (uint256, address));
    arminaPool.joinPoolFor(poolId, participant);
}
```

---

## User Journey

```
1. Connect Wallet (Privy / Coinbase Smart Wallet — gasless via Paymaster)
        │
2. Claim IDRX from Faucet (500,000 IDRX testnet tokens)
        │
3. Mint Reputation NFT (free soulbound token — establishes on-chain identity)
        │
4. Browse Pools → Select Tier
   ├── Small Pool    100K IDRX/month  · 3–5 members  · 30-day cycle
   ├── Medium Pool   500K IDRX/month  · 5–10 members · 30-day cycle
   └── Large Pool      1M IDRX/month  · 10–20 members · 30-day cycle
        │
5. Lock Collateral + First Month Payment (single approve + join transaction)
   └── Collateral = getDynamicCollateralMultiplier() × (members × contribution)
   └── Diamond reputation? → 25% discount applied automatically
        │
6. AI Yield Optimizer deploys idle collateral to highest-yield DeFi protocol
   └── Chainlink Functions fetches live APY from DeFiLlama via DON
   └── Auto-rebalances: Morpho 14.2% → Moonwell 12.5% → Aave 11.8% → ...
        │
7. Monthly: Chainlink Automation triggers the cycle autonomously
   └── Functions refreshes APY + Optimizer harvests yield
   └── VRF selects winner with cryptographically verifiable randomness
   └── Winner receives full monthly pot · Reputation scores updated on-chain
        │
8. Pool Completes → Collateral returned in full + yield earned over duration
```

---

## Smart Contracts

> All contracts deployed and verified on Base Sepolia. Full Chainlink CRE stack.

| Contract | Address | Verified |
|----------|---------|----------|
| **ArminaPool** | `0xeF490B63A0b15618f437C5b7BA774146Dc3213A3` | [Basescan ↗](https://sepolia.basescan.org/address/0xeF490B63A0b15618f437C5b7BA774146Dc3213A3#code) |
| **IDRX Token** | `0x7F197979D4046b2264De80D11359B6Cb5d1a8611` | [Basescan ↗](https://sepolia.basescan.org/address/0x7F197979D4046b2264De80D11359B6Cb5d1a8611#code) |
| **ArminaYieldOptimizer** | `0xA29B86204f0Dd052922C6417bceECd7554e5BC9a` | [Basescan ↗](https://sepolia.basescan.org/address/0xA29B86204f0Dd052922C6417bceECd7554e5BC9a#code) |
| **ArminaReputation** | `0xb4D23587F855C54E558d1a3d630Be53bdAEe16de` | [Basescan ↗](https://sepolia.basescan.org/address/0xb4D23587F855C54E558d1a3d630Be53bdAEe16de#code) |
| **ArminaAutomation** | `0x2f4298770BbAa71624154d29126BB863014Dbf41` | [Basescan ↗](https://sepolia.basescan.org/address/0x2f4298770BbAa71624154d29126BB863014Dbf41#code) |
| **ArminaFunctions** | `0x3502eb7116805f7220D7D654ab3c69e5ce328193` | [Basescan ↗](https://sepolia.basescan.org/address/0x3502eb7116805f7220D7D654ab3c69e5ce328193#code) |
| **ArminaCCIP** | `0x269f7d9701777a1Ab676a0129b1F058140776e83` | [Basescan ↗](https://sepolia.basescan.org/address/0x269f7d9701777a1Ab676a0129b1F058140776e83#code) |

### Chainlink Service Configuration

| Service | Details |
|---------|---------|
| **VRF V2.5** | Coordinator `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE` · Sub funded · ArminaPool registered as consumer |
| **Data Feeds** | ETH/USD `0x4aDC67D2Ff1e548cE5eBb4B89AA5B3e76509A6b5` · Base Sepolia · 1-hour staleness guard |
| **Functions** | Router `0xf9B8fc078197181C841c296C876945aaa425B278` · Sub #577 · ArminaFunctions registered |
| **Automation** | "Armina Monthly Cycle" upkeep · Custom logic · ArminaAutomation registered & active |
| **CCIP** | Router `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` · Ethereum Sepolia → Base Sepolia · Sender allowlisted |

---

## Soulbound Reputation System

Non-transferable ERC721 that grows with participation history. Higher reputation = lower collateral required to join — making arisan more accessible for trusted, long-term participants.

| Level | Score Threshold | Collateral Discount | Earned By |
|-------|----------------|--------------------|-|
| Bronze | 0 – 99 | 0% | Default on mint |
| Silver | 100 – 299 | 10% | Consistent on-time payments |
| Gold | 300 – 499 | 20% | Completing multiple pools |
| Diamond | 500+ | 25% | Long-term sustained participation |

Score events: on-time payment `+10` · pool completed `+50` · late payment `-20` · default `-100`

---

## Security

| Threat | Mitigation |
|--------|------------|
| Reentrancy | `ReentrancyGuard` on every state-changing function |
| Token transfer failures | OpenZeppelin `SafeERC20` throughout |
| Double settlement | `hasClaimed` mapping — one claim per participant per pool |
| VRF replay / double-draw | `drawRequested` mapping — one VRF request per pool per round |
| Oracle manipulation | Data Feeds staleness check → auto-escalates collateral to 150% |
| Unauthorized CCIP messages | Source chain + sender allowlisting on `ArminaCCIP._ccipReceive()` |
| Admin abuse | Owner-only functions limited to configuration; cannot touch user funds |

---

## Testing

122 tests covering the full lifecycle of every Chainlink integration:

```bash
npm test
```

| Suite | Tests | What's Covered |
|-------|-------|----------------|
| `ArminaPool.test.ts` | 48 | Pool lifecycle, collateral math, payment enforcement, settlement |
| `ArminaChainlink.test.ts` | 34 | VRF draw flow, Automation upkeep, Functions APY callback, Data Feed staleness |
| `ArminaReputation.test.ts` | 19 | SBT mint, scoring events, level progression, collateral discounts |
| `ArminaCCIP.test.ts` | 15 | Cross-chain joins, source chain allowlist, sender verification, rejection |
| `ArminaYieldOptimizer.test.ts` | 6 | Protocol ranking, deposit routing, APY comparison logic |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin 5 |
| Oracle / CRE | Chainlink VRF V2.5, Automation, Data Feeds, Functions, CCIP |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, wagmi v2, viem |
| Auth & Wallet | Privy (Email / Google / EOA) + Coinbase Smart Wallet |
| Gas | Coinbase Paymaster — fully gasless UX for users |
| DeFi Protocols | Moonwell, Aave V3, Compound V3, Morpho, Seamless, Fluid |
| Yield Data | DeFiLlama API fetched via Chainlink Functions DON |
| UI Kit | OnchainKit, Farcaster MiniKit |
| Token | IDRX — IDR-pegged testnet stablecoin |

---

## Run Locally

```bash
git clone https://github.com/yt2025id-lab/Armina.git
cd Armina
npm install
cp .env.example .env.local
# Fill in your keys (see .env.example for all required variables)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy Contracts

```bash
# Compile all contracts
npm run compile

# Deploy full Chainlink CRE stack to Base Sepolia
npx hardhat run scripts/setup-chainlink-live.ts --network baseSepolia

# Link contracts + configure Functions + CCIP
npx hardhat run scripts/continue-setup.ts --network baseSepolia

# Verify on Basescan
npm run verify -- <CONTRACT_ADDRESS>
```

### Post-Deploy Chainlink Dashboard Setup

1. **VRF** → [vrf.chain.link/base-sepolia](https://vrf.chain.link/base-sepolia) — create subscription, add `ArminaPool` as consumer, fund LINK
2. **Functions** → [functions.chain.link/base-sepolia](https://functions.chain.link/base-sepolia) — create subscription, add `ArminaFunctions`, fund LINK, call `setSubscriptionId()`
3. **Automation** → [automation.chain.link/base-sepolia](https://automation.chain.link/base-sepolia) — register `ArminaAutomation` as custom logic upkeep
4. **Data Feeds** — no setup needed; feeds are read directly in `getDynamicCollateralMultiplier()`
5. **CCIP** — pre-configured on deployment; Ethereum Sepolia source chain and sender allowlisted

---

## Project Structure

```
contracts/
├── ArminaPool.sol              # Core protocol — pool lifecycle, collateral, VRF, Data Feeds
├── ArminaYieldOptimizer.sol    # DeFi yield routing (Moonwell / Aave / Compound / Morpho)
├── ArminaAutomation.sol        # Chainlink Automation — autonomous monthly cycle trigger
├── ArminaFunctions.sol         # Chainlink Functions — live APY fetch + auto-rebalance
├── ArminaCCIP.sol              # Chainlink CCIP — cross-chain pool joining
├── ArminaReputation.sol        # Soulbound ERC721 reputation NFT with discount logic
└── IDRX.sol                    # IDR-pegged ERC20 token with testnet faucet

test/
├── ArminaPool.test.ts          # 48 tests — core protocol
├── ArminaChainlink.test.ts     # 34 tests — all Chainlink integrations
├── ArminaReputation.test.ts    # 19 tests — reputation system
└── ArminaCCIP.test.ts          # 15 tests — cross-chain security

src/app/
├── pool/                       # Browse & join pools with live on-chain data
├── pools/[id]/                 # Pool detail — participant list, yields, join flow
├── dashboard/                  # Active pools, payment schedule, collateral tracker
├── optimizer/                  # AI Yield Optimizer — live DeFi rates from DeFiLlama
├── chainlink/                  # Chainlink Integration Dashboard — live service status
├── profil/                     # Profile, reputation level, SBT
└── faucet/                     # IDRX testnet faucet

submission/
├── 01_PITCHDECK_CHAINLINK.md   # Chainlink track pitch deck (14 slides)
├── 02_PITCHDECK_BASE.md        # Base track pitch deck
├── 03_DEMO_VIDEO_SCRIPT.md     # Demo video script with voiceover cues
├── 04_QUICKSTART.md            # 5-minute quickstart for judges
└── 05–09_*.md                  # Architecture, user flow, deployment, testing docs
```

---

<div align="center">

**Built for Base Around the World Hackathon 2025 — Chainlink Track**

[armina-theta.vercel.app](https://armina-theta.vercel.app)

</div>
