/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lpbmxnikgnqtjhdhyxly.supabase.co',
      },
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      {
        module: /@supabase/,
        message: /Critical dependency/,
      },
    ];
    return config;
  },
};

module.exports = withPWA(nextConfig);