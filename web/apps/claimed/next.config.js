/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config) => {
    // Fix for @metamask/sdk — ignores react-native async storage
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'react-native': false,
      '@react-native-async-storage/async-storage': false,
    }
    // Fix for WalletConnect / viem — externalize node built-ins
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

module.exports = nextConfig
