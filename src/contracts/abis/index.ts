export { IDRX_ABI } from "./IDRX";
export { ARMINA_FACTORY_ABI } from "./ArminaFactory";
export { ARMINA_POOL_ABI } from "./ArminaPool";
export { ARMINA_REPUTATION_ABI } from "./ArminaReputation";

// Contract addresses (from .env.local after deployment)
export const CONTRACTS = {
  IDRX: process.env.NEXT_PUBLIC_IDRX_ADDRESS as `0x${string}` | undefined,
  FACTORY: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined,
  REPUTATION: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS as `0x${string}` | undefined,
};
