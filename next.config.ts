import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    // Handle React Native modules that aren't compatible with web
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "react-native": false,
      "@react-native-async-storage/async-storage": false,
    };

    // Ignore React Native specific modules
    config.externals = [
      ...(config.externals || []),
      {
        "@react-native-async-storage/async-storage": "commonjs @react-native-async-storage/async-storage",
      },
    ];

    return config;
  },
};

export default nextConfig;
