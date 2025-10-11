/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: false,
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

module.exports = nextConfig;