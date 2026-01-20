# 🌟 Armina - DeFi Arisan Platform

> **Platform arisan on-chain terdesentralisasi untuk komunitas Indonesia**
> Built for Base Indonesia Hackathon 2026

[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue)](https://sepolia.basescan.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19-yellow)](https://hardhat.org)

---

## 📖 Deskripsi Project

**Armina** adalah platform arisan digital yang sepenuhnya on-chain, dirancang khusus untuk komunitas Indonesia. Platform ini menggabungkan tradisi arisan dengan teknologi blockchain untuk memberikan transparansi, keamanan, dan auto-generating yield.

### 🎯 Masalah yang Dipecahkan

1. **Risiko Default** - Anggota arisan tradisional bisa kabur setelah dapat giliran
2. **Tidak Transparan** - Sulit melacak pembayaran dan pemilihan pemenang
3. **Idle Money** - Dana arisan tidak produktif menghasilkan yield
4. **Manual Process** - Perlu koordinator manusia untuk manage

### ✨ Solusi Armina

1. **Collateral 1000%** - Jaminan 10x lipat dari total pot untuk proteksi maksimal
2. **Smart Contract** - Semua transaksi tercatat on-chain, fully transparent
3. **AI Yield Optimizer** - Auto-deploy collateral ke protokol lending dengan APY tertinggi
4. **Chainlink VRF** - Pemilihan pemenang 100% fair & verifiable
5. **Reputation NFT** - Track record pembayaran tersimpan on-chain selamanya

---

## 🚀 Fitur Utama

### 1. **Pool Arisan Terdesentralisasi**
- 3 tier pool: Small (5 orang), Medium (10 orang), Large (20 orang)
- Iuran bulanan 100K - 1M IDRX (mock IDR stablecoin)
- Collateral 1000% (10x total pot) untuk keamanan maksimal
- Auto-payment dari collateral jika user gagal bayar

### 2. **AI Yield Optimizer**
- Otomatis deploy collateral ke protokol lending (Moonwell, Aave, dll)
- Selalu pilih protocol dengan APY tertinggi
- Double yield: dari collateral + dari pot yang terkumpul
- User dapat kembali collateral + yield di akhir pool

### 3. **Reputation System**
- Soulbound NFT (non-transferable) untuk track reputasi
- Score points untuk on-time payment, complete pool, dll
- 4 level: Bronze, Silver, Gold, Diamond
- Discount collateral hingga 25% untuk Diamond tier

### 4. **Chainlink VRF Integration**
- Pemilihan pemenang menggunakan Chainlink VRF V2
- 100% random, fair, dan verifiable on-chain
- Tidak bisa dimanipulasi oleh siapapun

### 5. **Progressive Web App**
- Responsive design, works on mobile & desktop
- Toast notifications untuk feedback real-time
- Loading skeletons untuk UX yang smooth
- IDRX balance indicator di header

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework dengan App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Styling & responsive design
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Privy** - Embedded wallet & authentication
- **react-hot-toast** - Toast notifications

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin v5** - Security-audited contracts
- **Chainlink VRF V2** - Verifiable randomness
- **Base Sepolia** - Layer 2 testnet (low gas fees)

### Backend/Infrastructure
- **IPFS** - Decentralized storage (future)
- **The Graph** - Indexing & querying (future)

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- npm atau yarn
- MetaMask atau compatible wallet
- Base Sepolia testnet ETH (for gas)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/armina.git
cd armina
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create `.env.local` in root directory:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Contract Addresses (Base Sepolia)
NEXT_PUBLIC_IDRX_ADDRESS=0x7F197979D4046b2264De80D11359B6Cb5d1a8611
NEXT_PUBLIC_ARMINA_POOL_ADDRESS=0xDdBFEBA307151a1991b68D31D9e6041852302fB7

# Network
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Smart Contracts (Deployed on Base Sepolia)

### Contract Addresses

| Contract | Address | Description |
|----------|---------|-------------|
| **IDRX** | `0x7F197979D4046b2264De80D11359B6Cb5d1a8611` | Mock IDR stablecoin dengan faucet |
| **ArminaPool** | `0xDdBFEBA307151a1991b68D31D9e6041852302fB7` | Main pool contract dengan VRF |

### Contract Details

#### IDRX.sol
- ERC20 token dengan 18 decimals
- Faucet: claim 10,000 IDRX per request
- For testnet purposes only

#### ArminaPool.sol
- Create pool dengan collateral 1000%
- Join pool dengan approve + deposit
- Monthly payment mechanism
- Chainlink VRF for winner selection
- Auto-deduct from collateral if missed payment
- Settlement dengan yield distribution

### Deploying Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy IDRX token
npx hardhat run scripts/deploy-idrx.ts --network baseSepolia

# Deploy ArminaPool
npx hardhat run scripts/deploy.ts --network baseSepolia
```

See [TESTNET_DEPLOYMENT.md](docs/TESTNET_DEPLOYMENT.md) for detailed deployment guide.

---

## 📱 User Flow

### First-Time User

1. **Connect Wallet** - Using Privy (email or wallet)
2. **Claim IDRX** - Get testnet tokens from faucet
3. **Create/Join Pool** - Choose pool size & monthly amount
4. **Approve IDRX** - Approve smart contract spending
5. **Deposit Collateral** - Lock 1000% collateral + first payment
6. **Monthly Payment** - Pay before day 10 each month
7. **Winner Drawing** - Day 20, Chainlink VRF selects winner
8. **Receive Pot** - Winner gets full pot + yield
9. **Pool Completion** - Get back collateral + yield at end

### Pool Lifecycle

```
Create Pool → Wait for Members → Pool Full → Activate
    ↓
Month 1-N: Payment Period (day 1-10) → Drawing (day 20) → Winner Receives Pot
    ↓
Pool Complete → Distribute Collateral + Yield → NFT Updated
```

---

## 🎮 Pool Configuration

### Pool Tiers

| Tier | Members | Monthly | Collateral | Total Due | Duration |
|------|---------|---------|------------|-----------|----------|
| **Small** | 5 | 100K IDRX | 5M IDRX | 5.1M | 5 months |
| **Medium** | 10 | 100K IDRX | 10M IDRX | 10.1M | 10 months |
| **Large** | 20 | 100K IDRX | 20M IDRX | 20.1M | 20 months |

### Collateral Formula

```
Collateral = Pool Size × Monthly Amount × 10
Total Due = Collateral + First Month Payment
```

**Example**: Pool 10 orang, iuran 100K/bulan
- Collateral: 10 × 100,000 × 10 = **10,000,000 IDRX**
- Total due: 10M + 100K = **10,100,000 IDRX**

---

## 🏆 Reputation System

### Point System

| Action | Points |
|--------|--------|
| ✅ On-time payment | +10 |
| ✅ Complete pool | +50 |
| ❌ Late payment | -20 |
| ❌ Default (missed payment) | -100 |

### Reputation Levels

| Level | Score Range | Collateral Discount |
|-------|-------------|---------------------|
| 🥉 Bronze | 0-99 | 0% |
| 🥈 Silver | 100-299 | 10% |
| 🥇 Gold | 300-499 | 20% |
| 💎 Diamond | 500+ | 25% |

---

## 📂 Project Structure

```
armina/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── faucet/            # IDRX faucet page
│   │   ├── pools/create/      # Create pool page
│   │   ├── pool/              # Browse pools page
│   │   ├── dashboard/         # User dashboard
│   │   └── ...
│   ├── components/
│   │   ├── onboarding/        # Onboarding slides
│   │   ├── pool/              # Pool-related components
│   │   ├── ui/                # UI components (Header, Toast, etc)
│   │   └── providers/         # Context providers
│   ├── contracts/
│   │   ├── abis/              # Contract ABIs & addresses
│   │   └── config.ts          # Contract configuration
│   ├── hooks/
│   │   ├── useArminaPool.ts   # Pool contract hooks
│   │   ├── useIDRX.ts         # IDRX token hooks
│   │   └── ...
│   ├── lib/
│   │   └── constants.ts       # App constants & helpers
│   └── types/
│       └── index.ts           # TypeScript types
├── contracts/                  # Smart contracts (Hardhat)
│   ├── ArminaPool.sol         # Main pool contract
│   ├── IDRX.sol               # Mock stablecoin
│   └── ...
├── scripts/                    # Deployment scripts
│   ├── deploy-idrx.ts
│   └── deploy.ts
├── docs/                       # Documentation
│   ├── TESTNET_DEPLOYMENT.md
│   ├── FRONTEND_TESTING.md
│   └── QUICKSTART.md
├── hardhat.config.ts          # Hardhat configuration
├── next.config.ts             # Next.js configuration
└── package.json
```

---

## 🧪 Testing

### Frontend Testing

See [FRONTEND_TESTING.md](docs/FRONTEND_TESTING.md) for comprehensive testing guide.

**Quick Test Flow**:
1. Connect wallet on Base Sepolia
2. Claim IDRX from faucet
3. Create a pool (5 members, 100K monthly)
4. Check calculations are correct
5. Approve & create transaction
6. Verify pool appears in browse page

### Smart Contract Testing

```bash
# Run Hardhat tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test
npx hardhat test test/ArminaPool.test.ts
```

---

## 🌐 Live Demo

- **Frontend**: [https://armina.vercel.app](https://armina.vercel.app) *(if deployed)*
- **Network**: Base Sepolia Testnet
- **Explorer**: [BaseScan Sepolia](https://sepolia.basescan.org)

### Get Started (Testnet)

1. Add Base Sepolia to MetaMask:
   - RPC: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Currency: `ETH`

2. Get testnet ETH:
   - [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)

3. Claim IDRX:
   - Visit [/faucet](http://localhost:3000/faucet)
   - Click "Claim 10,000 IDRX"

---

## 🔮 Roadmap

### Phase 1: MVP (Current) ✅
- [x] Smart contracts deployment
- [x] Frontend integration
- [x] IDRX faucet
- [x] Create & join pools
- [x] Basic UI/UX

### Phase 2: Core Features 🚧
- [ ] Chainlink VRF integration (winner selection)
- [ ] Monthly payment mechanism
- [ ] Reputation NFT minting
- [ ] Settlement & collateral return

### Phase 3: Advanced Features 🔜
- [ ] AI Yield Optimizer (Moonwell, Aave integration)
- [ ] Multi-chain support (Base mainnet)
- [ ] Real IDRX stablecoin integration
- [ ] The Graph indexing
- [ ] Mobile app (React Native)

### Phase 4: Production 🎯
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Marketing & onboarding
- [ ] Community building

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Developer** - Full-stack development
- **Smart Contract Engineer** - Solidity contracts
- **UI/UX Designer** - Interface design

---

## 🙏 Acknowledgments

- **Base** - For the amazing L2 infrastructure
- **Chainlink** - For VRF randomness
- **OpenZeppelin** - For secure contract libraries
- **Privy** - For seamless wallet integration
- **Vercel** - For hosting & deployment

---

## 📧 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Email**: your.email@example.com
- **Twitter**: [@armina_defi](https://twitter.com/armina_defi)

---

## 🔗 Links

- [Documentation](docs/)
- [Smart Contracts on BaseScan](https://sepolia.basescan.org/address/0xDdBFEBA307151a1991b68D31D9e6041852302fB7)
- [Deployment Guide](docs/TESTNET_DEPLOYMENT.md)
- [Testing Guide](docs/FRONTEND_TESTING.md)

---

**Built with ❤️ for Base Indonesia Hackathon 2026**
