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
};

module.exports = nextConfig;