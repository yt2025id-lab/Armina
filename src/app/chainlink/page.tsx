"use client";

import {
  useAutomationInterval,
  useTotalAutomatedDraws,
  useCheckUpkeep,
  useAutomationPool,
  useAutomationOptimizer,
} from "@/hooks/useAutomation";
import {
  useChainlinkPriceFeed,
  useVRFCoordinator,
  useVRFSubscriptionId,
  useVRFCallbackGasLimit,
} from "@/hooks/usePriceFeed";
import {
  useFunctionsLastAPY,
  useFunctionsLastProtocol,
  useFunctionsLastUpdated,
  useFunctionsTotalRequests,
  useFunctionsSubscriptionId,
  useFunctionsGasLimit,
} from "@/hooks/useFunctions";
import {
  ARMINA_POOL_ADDRESS,
  AUTOMATION_ADDRESS,
  FUNCTIONS_ADDRESS,
} from "@/contracts/config";

const truncateAddress = (addr: string | undefined) => {
  if (!addr) return "Not set";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatTimestamp = (ts: number) => {
  if (!ts) return "Never";
  const date = new Date(ts * 1000);
  return date.toLocaleString();
};

const formatTimeAgo = (ts: number) => {
  if (!ts) return "N/A";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function ChainlinkPage() {
  // VRF data
  const { vrfCoordinator } = useVRFCoordinator();
  const { subscriptionId: vrfSubId } = useVRFSubscriptionId();
  const { callbackGasLimit } = useVRFCallbackGasLimit();

  // Automation data
  const { interval, intervalHours } = useAutomationInterval();
  const { totalDraws } = useTotalAutomatedDraws();
  const { upkeepNeeded } = useCheckUpkeep();
  const { poolAddress: automationPool } = useAutomationPool();
  const { optimizerAddress: automationOptimizer } = useAutomationOptimizer();

  // Price Feed / APY data
  const { currentAPY, currentAPYPercent } = useChainlinkPriceFeed();

  // Functions data
  const { lastAPY, lastAPYPercent } = useFunctionsLastAPY();
  const { protocolId, protocolName } = useFunctionsLastProtocol();
  const { lastUpdated } = useFunctionsLastUpdated();
  const { totalRequests } = useFunctionsTotalRequests();
  const { subscriptionId: fnSubId } = useFunctionsSubscriptionId();
  const { gasLimit: fnGasLimit } = useFunctionsGasLimit();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#1e2a4a] px-5 pt-10 pb-10 text-white">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold">Chainlink Integrations</h1>
          <p className="text-white/60 text-sm mt-2">
            4 Chainlink services powering Armina on Base Sepolia
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/10 backdrop-blur rounded-xl text-center">
            <p className="text-xs text-white/60">Services Active</p>
            <p className="text-3xl font-bold text-white">4</p>
            <p className="text-xs text-green-400">All Operational</p>
          </div>
          <div className="p-4 bg-white/10 backdrop-blur rounded-xl text-center">
            <p className="text-xs text-white/60">Total Automated Draws</p>
            <p className="text-3xl font-bold text-white">{totalDraws}</p>
            <p className="text-xs text-green-400">Via Automation</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6 -mt-4 bg-white rounded-t-3xl">

        {/* 1. VRF Card */}
        <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">VRF</span>
              </div>
              <div>
                <p className="font-bold text-purple-900">Chainlink VRF V2.5</p>
                <p className="text-xs text-purple-600">Verifiable Random Function</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl mb-3">
            <p className="text-sm text-slate-600 mb-3">
              VRF provides provably fair, tamper-proof randomness for winner selection in each arisan pool round.
              Every draw is verifiable on-chain.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Purpose</span>
                <span className="font-semibold text-purple-900">Winner Selection</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Coordinator</span>
                <a
                  href={vrfCoordinator ? `https://sepolia.basescan.org/address/${vrfCoordinator}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-purple-600 hover:text-purple-800 text-xs"
                >
                  {truncateAddress(vrfCoordinator)}
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subscription ID</span>
                <span className="font-semibold text-purple-900">{vrfSubId || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Callback Gas Limit</span>
                <span className="font-semibold text-purple-900">
                  {callbackGasLimit ? callbackGasLimit.toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pool Contract</span>
                <a
                  href={ARMINA_POOL_ADDRESS ? `https://sepolia.basescan.org/address/${ARMINA_POOL_ADDRESS}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-purple-600 hover:text-purple-800 text-xs"
                >
                  {truncateAddress(ARMINA_POOL_ADDRESS)}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Randomness requests processed on every draw</span>
          </div>
        </div>

        {/* 2. Automation Card */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">AUTO</span>
              </div>
              <div>
                <p className="font-bold text-blue-900">Chainlink Automation</p>
                <p className="text-xs text-blue-600">Decentralized Keeper Network</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              upkeepNeeded
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}>
              {upkeepNeeded ? "Upkeep Needed" : "Active"}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl mb-3">
            <p className="text-sm text-slate-600 mb-3">
              Automation triggers pool draws and yield harvests on schedule without manual intervention.
              The keeper checks if any pool is ready for a draw or harvest.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Interval</p>
                <p className="text-xl font-bold text-blue-900">
                  {intervalHours ? `${intervalHours}h` : `${interval}s`}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Total Draws</p>
                <p className="text-xl font-bold text-blue-900">{totalDraws}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Upkeep Needed</span>
                <span className={`font-semibold ${upkeepNeeded ? "text-amber-600" : "text-green-600"}`}>
                  {upkeepNeeded ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Linked Pool</span>
                <a
                  href={automationPool ? `https://sepolia.basescan.org/address/${automationPool}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:text-blue-800 text-xs"
                >
                  {truncateAddress(automationPool)}
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Linked Optimizer</span>
                <a
                  href={automationOptimizer ? `https://sepolia.basescan.org/address/${automationOptimizer}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:text-blue-800 text-xs"
                >
                  {truncateAddress(automationOptimizer)}
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Contract</span>
                <a
                  href={AUTOMATION_ADDRESS ? `https://sepolia.basescan.org/address/${AUTOMATION_ADDRESS}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:text-blue-800 text-xs"
                >
                  {truncateAddress(AUTOMATION_ADDRESS)}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-blue-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Keeper network monitors and triggers upkeeps automatically</span>
          </div>
        </div>

        {/* 3. Data Feeds Card */}
        <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">DF</span>
              </div>
              <div>
                <p className="font-bold text-green-900">Chainlink Data Feeds</p>
                <p className="text-xs text-green-600">Decentralized Oracle Network</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl mb-3">
            <p className="text-sm text-slate-600 mb-3">
              Data Feeds provide real-time ETH/USD pricing for collateral valuation, yield calculations,
              and transparent on-chain price references across the Armina protocol.
            </p>

            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white text-center mb-3">
              <p className="text-xs text-white/70">Current On-Chain APY</p>
              <p className="text-4xl font-bold">{currentAPYPercent.toFixed(2)}%</p>
              <p className="text-xs text-white/70 mt-1">
                {currentAPY} basis points
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Feed Type</span>
                <span className="font-semibold text-green-900">ETH / USD</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Network</span>
                <span className="font-semibold text-green-900">Base Sepolia</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Used For</span>
                <span className="font-semibold text-green-900">Collateral Valuation</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pool Contract</span>
                <a
                  href={ARMINA_POOL_ADDRESS ? `https://sepolia.basescan.org/address/${ARMINA_POOL_ADDRESS}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-green-600 hover:text-green-800 text-xs"
                >
                  {truncateAddress(ARMINA_POOL_ADDRESS)}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Price data updated continuously by Chainlink oracle network</span>
          </div>
        </div>

        {/* 4. Functions Card */}
        <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">FN</span>
              </div>
              <div>
                <p className="font-bold text-orange-900">Chainlink Functions</p>
                <p className="text-xs text-orange-600">Serverless Off-chain Computation</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              Active
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl mb-3">
            <p className="text-sm text-slate-600 mb-3">
              Functions fetches live DeFi APY data from external APIs (DeFiLlama) and writes the best protocol
              and APY on-chain to keep the YieldOptimizer updated with real-world rates.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Last APY</p>
                <p className="text-xl font-bold text-orange-900">{lastAPYPercent.toFixed(2)}%</p>
                <p className="text-xs text-slate-400">{lastAPY} bps</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-slate-500">Best Protocol</p>
                <p className="text-xl font-bold text-orange-900">{protocolName}</p>
                <p className="text-xs text-slate-400">ID: {protocolId}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total Requests</span>
                <span className="font-semibold text-orange-900">{totalRequests}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-semibold text-orange-900">
                  {lastUpdated ? formatTimeAgo(lastUpdated) : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Last Update Time</span>
                <span className="font-mono text-orange-700 text-xs">
                  {formatTimestamp(lastUpdated)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subscription ID</span>
                <span className="font-semibold text-orange-900">{fnSubId || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Gas Limit</span>
                <span className="font-semibold text-orange-900">
                  {fnGasLimit ? fnGasLimit.toLocaleString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Contract</span>
                <a
                  href={FUNCTIONS_ADDRESS ? `https://sepolia.basescan.org/address/${FUNCTIONS_ADDRESS}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-orange-600 hover:text-orange-800 text-xs"
                >
                  {truncateAddress(FUNCTIONS_ADDRESS)}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-orange-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Off-chain JS execution delivers DeFiLlama data on-chain</span>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <p className="font-semibold mb-4">Architecture Overview</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-300">1</span>
              </div>
              <div>
                <p className="font-medium">VRF -- ArminaPool</p>
                <p className="text-white/60 text-xs">Pool requests randomness, VRF coordinator calls back with verified random number for fair winner selection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-300">2</span>
              </div>
              <div>
                <p className="font-medium">Automation -- ArminaAutomation</p>
                <p className="text-white/60 text-xs">Keeper checks pools for due draws and harvests, triggers upkeep when interval passes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-green-300">3</span>
              </div>
              <div>
                <p className="font-medium">Data Feeds -- ArminaPool</p>
                <p className="text-white/60 text-xs">ETH/USD price feed used for collateral valuation and yield calculations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-orange-300">4</span>
              </div>
              <div>
                <p className="font-medium">Functions -- ArminaFunctions</p>
                <p className="text-white/60 text-xs">Executes JavaScript off-chain to fetch DeFiLlama APY data and updates YieldOptimizer on-chain</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Badge */}
        <div className="p-5 bg-gradient-to-r from-[#1e2a4a] to-[#2a3a5c] rounded-2xl text-white">
          <p className="font-semibold mb-3">Powered By Chainlink</p>
          <div className="flex flex-wrap gap-2">
            {[
              "VRF V2.5",
              "Automation",
              "Data Feeds",
              "Functions",
              "Base Sepolia",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="text-white/50 text-xs mt-3">
            All Chainlink services are deployed and verified on Base Sepolia testnet
          </p>
        </div>
      </div>
    </div>
  );
}
