"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "id";

interface Translations {
  // Homepage
  connectWallet: string;
  connectWalletDesc: string;
  connected: string;
  idrxBalance: string;
  topUp: string;
  howToPlay: string;
  howToPlayDesc: string;
  startArisan: string;
  startArisanDesc: string;
  activePools: string;
  completed: string;
  getFreeIdrx: string;
  getFreeIdrxDesc: string;
  aiYieldOptimizer: string;
  collateralYield: string;
  yourActivePools: string;
  viewAll: string;
  noActivePools: string;
  joinPoolNow: string;

  // Onboarding
  welcomeTo: string;
  onboardingDesc: string;
  howItWorks: string;
  arisanMiniApp: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  step6: string;
  collateral: string;
  maxProtection: string;
  // Collateral slide - labels
  collateralAmountLabel: string;
  latePaymentLabel: string;
  poolCompletedLabel: string;
  defaultLabel: string;
  // Collateral slide - values
  collateralAmountValue: string;
  latePaymentValue: string;
  poolCompletedValue: string;
  defaultValue: string;
  yieldDouble: string;
  yieldDesc: string;
  collateralYieldDesc: string;
  potYield: string;
  potYieldDesc: string;
  reputation: string;
  system: string;
  reputationDesc: string;
  onTimePayment: string;
  completePool: string;
  latePayment: string;
  default: string;
  readyTo: string;
  start: string;
  mintNftDesc: string;
  back: string;
  next: string;
  startNow: string;
  skip: string;

  // Pool Page
  poolsTitle: string;
  createPool: string;
  openPools: string;
  activePools2: string;
  completedPools: string;
  joinPool: string;
  reviewPoolDetails: string;
  poolTier: string;
  contributionMonth: string;
  participants: string;
  duration: string;
  months: string;
  collateralRequired: string;
  willBeReturned: string;
  cancel: string;
  confirmJoin: string;
  connectWalletToJoin: string;
  noOpenPools: string;
  noActivePools2: string;
  noCompletedPools: string;
  contribution: string;
  slots: string;

  // Faucet Page
  faucetTitle: string;
  faucetDesc: string;
  yourBalance: string;
  faucetDetails: string;
  amountPerClaim: string;
  network: string;
  rateLimit: string;
  unlimited: string;
  claimSuccess: string;
  connectToClaim: string;
  claiming: string;
  confirming: string;
  claimIdrx: string;
  whatIsIdrx: string;
  whatIsIdrxDesc: string;
  howToUseIdrx: string;
  howToUseIdrx1: string;
  howToUseIdrx2: string;
  howToUseIdrx3: string;
  howToUseIdrx4: string;
  needMoreTokens: string;
  needMoreTokensDesc: string;
  forCreatingPools: string;
  readyToStart: string;
  browsePools: string;

  // Profile Page
  walletAddress: string;
  reputationStatus: string;
  collateralDiscount: string;
  statistics: string;
  completedPools2: string;
  totalPotReceived: string;
  totalYield: string;
  paymentHistory: string;
  onTime: string;
  late: string;
  balance: string;
  gasFeeToken: string;
  arisanToken: string;
  recentActivity: string;
  idrxFaucet: string;
  faucetCooldown: string;
  claimIdrxAmount: string;
  links: string;
  viewOnBaseScan: string;
  idrxContract: string;

  // Optimizer Page
  autoSelectsHighestApy: string;
  currentlyActive: string;
  fundsDeployed: string;
  earning: string;
  apy: string;
  nextCheck: string;
  protocolTvl: string;
  riskDisclosure: string;
  riskDisclosureDesc: string;
  yourPosition: string;
  active: string;
  collateralYieldLabel: string;
  potYieldLabel: string;
  idrxMonth: string;
  forWinner: string;
  totalYieldEarned: string;
  apyBreakdown: string;
  autoCompounded: string;
  withdraw: string;
  managePosition: string;
  connectToEarn: string;
  depositToEarn: string;
  autoOptimized: string;
  howItWorksTitle: string;
  viewDocs: string;
  autoDeposit: string;
  autoDepositDesc: string;
  aiPicksBestApy: string;
  aiPicksBestApyDesc: string;
  autoCompoundDaily: string;
  autoCompoundDailyDesc: string;
  doubleYield: string;
  doubleYieldDesc: string;
  topProtocols: string;
  liveApyRates: string;
  aiChecksEvery6Hours: string;
  monthlyTimeline: string;
  day1to10: string;
  payContribution: string;
  day11to19: string;
  fundsDeployedEarning: string;
  day20: string;
  drawingYieldDist: string;
  yieldCompoundsAuto: string;
  securityTransparency: string;
  allProtocolsAudited: string;
  fundsInYourControl: string;
  transparentOnChain: string;
  noLockPeriods: string;
  feeStructure: string;
  managementFee: string;
  performanceFee: string;
  withdrawalFee: string;
  gasFeesApply: string;
  totalValueOptimized: string;
  activeUsersEarning: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Homepage
    connectWallet: "Connect Coinbase Wallet",
    connectWalletDesc: "Use Coinbase Smart Wallet to get started",
    connected: "Connected",
    idrxBalance: "IDRX Balance",
    topUp: "Top Up",
    howToPlay: "How to Play",
    howToPlayDesc: "Learn how to use Armina",
    startArisan: "Start Arisan",
    startArisanDesc: "Join or create a new arisan pool",
    activePools: "Active Pools",
    completed: "Completed",
    getFreeIdrx: "Get Free IDRX",
    getFreeIdrxDesc: "Claim 500,000 IDRX from testnet faucet",
    aiYieldOptimizer: "AI Yield Optimizer",
    collateralYield: "Collateral & pot auto-generate yield",
    yourActivePools: "Your Active Pools",
    viewAll: "View All",
    noActivePools: "No active pools yet",
    joinPoolNow: "Join a Pool Now",

    // Onboarding
    welcomeTo: "Welcome to",
    onboardingDesc: "The first on-chain rotating savings platform (arisan) for the Indonesian community. Transparent, secure, and auto-generating yield.",
    howItWorks: "How It Works",
    arisanMiniApp: "Arisan Mini App",
    step1: "Choose a pool that fits your budget",
    step2: "Deposit collateral + first contribution",
    step3: "Pay contribution before day 10",
    step4: "Day 20: Winner drawing",
    step5: "Winner receives pot + yield monthly",
    step6: "Pool ends, collateral + yield returned",
    collateral: "Collateral",
    maxProtection: "Security, commitment & yield farming capital",
    // Collateral slide - labels
    collateralAmountLabel: "Collateral Amount",
    latePaymentLabel: "Late Payment",
    poolCompletedLabel: "On-time Payment",
    defaultLabel: "Default/Missed",
    // Collateral slide - values
    collateralAmountValue: "125% × (participants × contribution)",
    latePaymentValue: "Deducted + yield proportional",
    poolCompletedValue: "100% collateral + full yield",
    defaultValue: "Deducted + yield from remaining",
    yieldDouble: "Double",
    yieldDesc: "AI Optimizer automatically selects the highest APY lending protocol",
    collateralYieldDesc: "Your collateral generates yield while pool is active, automatically deployed to highest APY protocol",
    potYield: "Pot Yield",
    potYieldDesc: "Collected contributions earn yield during collection period",
    reputation: "Reputation",
    system: "System",
    reputationDesc: "Build your reputation score to climb the leaderboard",
    onTimePayment: "On-time payment",
    completePool: "Complete pool",
    latePayment: "Late payment",
    default: "Default",
    readyTo: "Ready to",
    start: "Start?",
    mintNftDesc: "Mint your free Reputation NFT to begin. This NFT is Soulbound and non-transferable.",
    back: "Back",
    next: "Next",
    startNow: "Start Now",
    skip: "Skip",

    // Pool Page
    poolsTitle: "Arisan Pools",
    createPool: "Create Pool",
    openPools: "Open",
    activePools2: "Active",
    completedPools: "Completed",
    joinPool: "Join Pool",
    reviewPoolDetails: "Review pool details before joining",
    poolTier: "Pool Tier",
    contributionMonth: "Contribution/Month",
    participants: "Participants",
    duration: "Duration",
    months: "months",
    collateralRequired: "Collateral Required",
    willBeReturned: "Will be returned with yield after pool completion",
    cancel: "Cancel",
    confirmJoin: "Confirm Join",
    connectWalletToJoin: "Connect Wallet to Join",
    noOpenPools: "No open pools yet",
    noActivePools2: "No active pools",
    noCompletedPools: "No completed pools",
    contribution: "Contribution",
    slots: "slots",

    // Faucet Page
    faucetTitle: "IDRX Faucet",
    faucetDesc: "Get free testnet IDRX tokens for testing",
    yourBalance: "Your IDRX Balance",
    faucetDetails: "Faucet Details",
    amountPerClaim: "Amount per claim",
    network: "Network",
    rateLimit: "Rate limit",
    unlimited: "Unlimited (testnet)",
    claimSuccess: "Successfully claimed 500,000 IDRX!",
    connectToClaim: "Connect Wallet to Claim",
    claiming: "Claiming...",
    confirming: "Confirming...",
    claimIdrx: "Claim 500,000 IDRX",
    whatIsIdrx: "What is IDRX?",
    whatIsIdrxDesc: "IDRX is a mock ERC20 token representing Indonesian Rupiah on the blockchain. It's used for testing the Armina DeFi platform on Base Sepolia testnet. These tokens have no real value.",
    howToUseIdrx: "How to use IDRX",
    howToUseIdrx1: "Create arisan pools (requires collateral)",
    howToUseIdrx2: "Join existing pools",
    howToUseIdrx3: "Pay monthly contributions",
    howToUseIdrx4: "Receive payouts when you win",
    needMoreTokens: "Need more tokens?",
    needMoreTokensDesc: "You can claim from the faucet as many times as you need for testing. No rate limits on testnet!",
    forCreatingPools: "For creating pools, you'll need:",
    readyToStart: "Ready to get started?",
    browsePools: "Browse Pools",

    // Profile Page
    walletAddress: "Wallet Address",
    reputationStatus: "Reputation Status",
    collateralDiscount: "Collateral Discount",
    statistics: "Statistics",
    completedPools2: "Completed Pools",
    totalPotReceived: "Total Pot Received",
    totalYield: "Total Yield",
    paymentHistory: "Payment History",
    onTime: "On Time",
    late: "Late",
    balance: "Balance",
    gasFeeToken: "Gas fee token",
    arisanToken: "Arisan token",
    recentActivity: "Recent Activity",
    idrxFaucet: "IDRX Faucet",
    faucetCooldown: "Get 500,000 IDRX free for testing. 5-hour cooldown.",
    claimIdrxAmount: "Claim 500,000 IDRX",
    links: "Links",
    viewOnBaseScan: "View on BaseScan",
    idrxContract: "IDRX Contract",

    // Optimizer Page
    autoSelectsHighestApy: "Automatically selects highest APY",
    currentlyActive: "Currently Active",
    fundsDeployed: "Funds deployed",
    earning: "Earning",
    apy: "APY",
    nextCheck: "Next check",
    protocolTvl: "Protocol TVL",
    riskDisclosure: "Risk Disclosure",
    riskDisclosureDesc: "Funds are deployed to third-party DeFi protocols. Smart contract risks apply. Yield rates are variable and not guaranteed.",
    yourPosition: "Your Position",
    active: "Active",
    collateralYieldLabel: "Collateral Yield",
    potYieldLabel: "Pot Yield",
    idrxMonth: "IDRX/month",
    forWinner: "for winner",
    totalYieldEarned: "Total Yield Earned",
    apyBreakdown: "APY Breakdown",
    autoCompounded: "Auto-compounded daily",
    withdraw: "Withdraw",
    managePosition: "Manage Position",
    connectToEarn: "Connect wallet to start earning yield",
    depositToEarn: "Deposit to Earn",
    autoOptimized: "Auto-optimized • Collateral & pot funds earn yield",
    howItWorksTitle: "How It Works",
    viewDocs: "View Docs",
    autoDeposit: "Auto Deposit",
    autoDepositDesc: "Collateral & pot funds automatically deployed to lending protocol",
    aiPicksBestApy: "AI Picks Best APY",
    aiPicksBestApyDesc: "AI checks every 6 hours and switches to protocol with highest APY",
    autoCompoundDaily: "Auto-Compound Daily",
    autoCompoundDailyDesc: "Yield automatically compounds daily to maximize returns",
    doubleYield: "Double Yield",
    doubleYieldDesc: "Collateral yield for you, pot yield bonus for winner",
    topProtocols: "Top 5 Protocols",
    liveApyRates: "Live APY rates",
    aiChecksEvery6Hours: "AI checks every 6 hours • Switches automatically to highest APY",
    monthlyTimeline: "Monthly Timeline",
    day1to10: "Day 1-10",
    payContribution: "Pay contribution (deadline)",
    day11to19: "Day 11-19",
    fundsDeployedEarning: "Funds deployed & earning yield",
    day20: "Day 20",
    drawingYieldDist: "Drawing + Yield Distribution",
    yieldCompoundsAuto: "Yield compounds automatically during deployment period",
    securityTransparency: "Security & Transparency",
    allProtocolsAudited: "All protocols are audited and battle-tested",
    fundsInYourControl: "Funds remain in your control, withdrawable anytime",
    transparentOnChain: "Transparent on-chain transactions",
    noLockPeriods: "No lock periods or withdrawal penalties",
    feeStructure: "Fee Structure",
    managementFee: "Management Fee",
    performanceFee: "Performance Fee",
    withdrawalFee: "Withdrawal Fee",
    gasFeesApply: "Gas fees apply for on-chain transactions",
    totalValueOptimized: "Total Value Optimized",
    activeUsersEarning: "Across 1,234 active users earning yield",
  },
  id: {
    // Homepage
    connectWallet: "Hubungkan Coinbase Wallet",
    connectWalletDesc: "Gunakan Coinbase Smart Wallet untuk memulai",
    connected: "Terhubung",
    idrxBalance: "Saldo IDRX",
    topUp: "Isi Ulang",
    howToPlay: "Cara Bermain",
    howToPlayDesc: "Pelajari cara menggunakan Armina",
    startArisan: "Mulai Arisan",
    startArisanDesc: "Bergabung atau buat pool arisan baru",
    activePools: "Pool Aktif",
    completed: "Selesai",
    getFreeIdrx: "Dapatkan IDRX Gratis",
    getFreeIdrxDesc: "Klaim 500.000 IDRX dari faucet testnet",
    aiYieldOptimizer: "AI Yield Optimizer",
    collateralYield: "Kolateral & pot otomatis menghasilkan yield",
    yourActivePools: "Pool Aktif Anda",
    viewAll: "Lihat Semua",
    noActivePools: "Belum ada pool aktif",
    joinPoolNow: "Gabung Pool Sekarang",

    // Onboarding
    welcomeTo: "Selamat Datang di",
    onboardingDesc: "Platform arisan on-chain pertama untuk komunitas Indonesia. Transparan, aman, dan otomatis menghasilkan yield.",
    howItWorks: "Cara Kerja",
    arisanMiniApp: "Mini App Arisan",
    step1: "Pilih pool sesuai budget Anda",
    step2: "Setor kolateral + iuran pertama",
    step3: "Bayar iuran sebelum tanggal 10",
    step4: "Tanggal 20: Pengundian pemenang",
    step5: "Pemenang terima pot + yield bulanan",
    step6: "Pool selesai, kolateral + yield dikembalikan",
    collateral: "Kolateral",
    maxProtection: "Keamanan, komitmen & modal yield farming",
    // Collateral slide - labels
    collateralAmountLabel: "Besaran Kolateral",
    latePaymentLabel: "Telat Bayar",
    poolCompletedLabel: "Bayar Tepat Waktu",
    defaultLabel: "Gagal Bayar",
    // Collateral slide - values
    collateralAmountValue: "125% × (peserta × iuran)",
    latePaymentValue: "Dipotong + yield proporsional",
    poolCompletedValue: "100% kolateral + yield penuh",
    defaultValue: "Dipotong + yield dari sisa",
    yieldDouble: "Yield",
    yieldDesc: "AI Optimizer otomatis memilih protokol lending dengan APY tertinggi",
    collateralYieldDesc: "Kolateral Anda menghasilkan yield selama pool aktif, otomatis di-deploy ke protokol APY tertinggi",
    potYield: "Yield Pot",
    potYieldDesc: "Iuran terkumpul menghasilkan yield selama periode pengumpulan",
    reputation: "Reputasi",
    system: "Sistem",
    reputationDesc: "Bangun skor reputasi Anda untuk naik peringkat",
    onTimePayment: "Bayar tepat waktu",
    completePool: "Selesaikan pool",
    latePayment: "Telat bayar",
    default: "Gagal bayar",
    readyTo: "Siap untuk",
    start: "Mulai?",
    mintNftDesc: "Mint NFT Reputasi gratis Anda untuk memulai. NFT ini Soulbound dan tidak dapat ditransfer.",
    back: "Kembali",
    next: "Lanjut",
    startNow: "Mulai Sekarang",
    skip: "Lewati",

    // Pool Page
    poolsTitle: "Pool Arisan",
    createPool: "Buat Pool",
    openPools: "Terbuka",
    activePools2: "Aktif",
    completedPools: "Selesai",
    joinPool: "Gabung Pool",
    reviewPoolDetails: "Tinjau detail pool sebelum bergabung",
    poolTier: "Tier Pool",
    contributionMonth: "Iuran/Bulan",
    participants: "Peserta",
    duration: "Durasi",
    months: "bulan",
    collateralRequired: "Kolateral Diperlukan",
    willBeReturned: "Akan dikembalikan dengan yield setelah pool selesai",
    cancel: "Batal",
    confirmJoin: "Konfirmasi Gabung",
    connectWalletToJoin: "Hubungkan Wallet untuk Gabung",
    noOpenPools: "Belum ada pool terbuka",
    noActivePools2: "Tidak ada pool aktif",
    noCompletedPools: "Tidak ada pool selesai",
    contribution: "Iuran",
    slots: "slot",

    // Faucet Page
    faucetTitle: "Faucet IDRX",
    faucetDesc: "Dapatkan token IDRX testnet gratis untuk pengujian",
    yourBalance: "Saldo IDRX Anda",
    faucetDetails: "Detail Faucet",
    amountPerClaim: "Jumlah per klaim",
    network: "Jaringan",
    rateLimit: "Batas klaim",
    unlimited: "Tidak terbatas (testnet)",
    claimSuccess: "Berhasil klaim 500.000 IDRX!",
    connectToClaim: "Hubungkan Wallet untuk Klaim",
    claiming: "Mengklaim...",
    confirming: "Mengonfirmasi...",
    claimIdrx: "Klaim 500.000 IDRX",
    whatIsIdrx: "Apa itu IDRX?",
    whatIsIdrxDesc: "IDRX adalah token ERC20 simulasi yang mewakili Rupiah Indonesia di blockchain. Digunakan untuk pengujian platform DeFi Armina di Base Sepolia testnet. Token ini tidak memiliki nilai nyata.",
    howToUseIdrx: "Cara menggunakan IDRX",
    howToUseIdrx1: "Buat pool arisan (memerlukan kolateral)",
    howToUseIdrx2: "Gabung pool yang ada",
    howToUseIdrx3: "Bayar iuran bulanan",
    howToUseIdrx4: "Terima pembayaran saat menang",
    needMoreTokens: "Butuh lebih banyak token?",
    needMoreTokensDesc: "Anda bisa klaim dari faucet sebanyak yang diperlukan untuk pengujian. Tidak ada batas di testnet!",
    forCreatingPools: "Untuk membuat pool, Anda perlu:",
    readyToStart: "Siap untuk memulai?",
    browsePools: "Lihat Pool",

    // Profile Page
    walletAddress: "Alamat Wallet",
    reputationStatus: "Status Reputasi",
    collateralDiscount: "Diskon Kolateral",
    statistics: "Statistik",
    completedPools2: "Pool Selesai",
    totalPotReceived: "Total Pot Diterima",
    totalYield: "Total Yield",
    paymentHistory: "Riwayat Pembayaran",
    onTime: "Tepat Waktu",
    late: "Terlambat",
    balance: "Saldo",
    gasFeeToken: "Token gas fee",
    arisanToken: "Token arisan",
    recentActivity: "Aktivitas Terbaru",
    idrxFaucet: "Faucet IDRX",
    faucetCooldown: "Dapatkan 500.000 IDRX gratis untuk pengujian. Cooldown 5 jam.",
    claimIdrxAmount: "Klaim 500.000 IDRX",
    links: "Tautan",
    viewOnBaseScan: "Lihat di BaseScan",
    idrxContract: "Kontrak IDRX",

    // Optimizer Page
    autoSelectsHighestApy: "Otomatis memilih APY tertinggi",
    currentlyActive: "Saat Ini Aktif",
    fundsDeployed: "Dana di-deploy",
    earning: "Menghasilkan",
    apy: "APY",
    nextCheck: "Pengecekan berikutnya",
    protocolTvl: "TVL Protokol",
    riskDisclosure: "Pemberitahuan Risiko",
    riskDisclosureDesc: "Dana di-deploy ke protokol DeFi pihak ketiga. Risiko smart contract berlaku. Tingkat yield bervariasi dan tidak dijamin.",
    yourPosition: "Posisi Anda",
    active: "Aktif",
    collateralYieldLabel: "Yield Kolateral",
    potYieldLabel: "Yield Pot",
    idrxMonth: "IDRX/bulan",
    forWinner: "untuk pemenang",
    totalYieldEarned: "Total Yield Diperoleh",
    apyBreakdown: "Rincian APY",
    autoCompounded: "Auto-compound harian",
    withdraw: "Tarik",
    managePosition: "Kelola Posisi",
    connectToEarn: "Hubungkan wallet untuk mulai menghasilkan yield",
    depositToEarn: "Setor untuk Menghasilkan",
    autoOptimized: "Auto-optimisasi • Dana kolateral & pot menghasilkan yield",
    howItWorksTitle: "Cara Kerja",
    viewDocs: "Lihat Dokumen",
    autoDeposit: "Setor Otomatis",
    autoDepositDesc: "Dana kolateral & pot otomatis di-deploy ke protokol lending",
    aiPicksBestApy: "AI Pilih APY Terbaik",
    aiPicksBestApyDesc: "AI mengecek setiap 6 jam dan beralih ke protokol dengan APY tertinggi",
    autoCompoundDaily: "Auto-Compound Harian",
    autoCompoundDailyDesc: "Yield otomatis di-compound harian untuk memaksimalkan keuntungan",
    doubleYield: "Yield Ganda",
    doubleYieldDesc: "Yield kolateral untuk Anda, bonus yield pot untuk pemenang",
    topProtocols: "Top 5 Protokol",
    liveApyRates: "Rate APY langsung",
    aiChecksEvery6Hours: "AI mengecek setiap 6 jam • Beralih otomatis ke APY tertinggi",
    monthlyTimeline: "Timeline Bulanan",
    day1to10: "Hari 1-10",
    payContribution: "Bayar iuran (batas waktu)",
    day11to19: "Hari 11-19",
    fundsDeployedEarning: "Dana di-deploy & menghasilkan yield",
    day20: "Hari 20",
    drawingYieldDist: "Pengundian + Distribusi Yield",
    yieldCompoundsAuto: "Yield otomatis di-compound selama periode deployment",
    securityTransparency: "Keamanan & Transparansi",
    allProtocolsAudited: "Semua protokol telah diaudit dan teruji",
    fundsInYourControl: "Dana tetap dalam kendali Anda, bisa ditarik kapan saja",
    transparentOnChain: "Transaksi on-chain transparan",
    noLockPeriods: "Tidak ada periode kunci atau penalti penarikan",
    feeStructure: "Struktur Biaya",
    managementFee: "Biaya Manajemen",
    performanceFee: "Biaya Performa",
    withdrawalFee: "Biaya Penarikan",
    gasFeesApply: "Biaya gas berlaku untuk transaksi on-chain",
    totalValueOptimized: "Total Nilai Dioptimalkan",
    activeUsersEarning: "Dari 1.234 pengguna aktif menghasilkan yield",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("armina_language") as Language;
    if (saved && (saved === "en" || saved === "id")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("armina_language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
