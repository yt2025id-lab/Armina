import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: "Armina - Arisan Mini App",
      appLogoUrl: "https://armina.app/logo.png",
      // Gunakan EOA (bukan Smart Wallet) agar gas estimation dan allowance bekerja normal.
      // smartWalletOnly menyebabkan address berbeda sehingga joinPool selalu gagal estimate gas.
      preference: "eoaOnly",
    }),
  ],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
