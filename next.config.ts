import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Production WooCommerce Host (DuckDNS)
        protocol: 'https',
        hostname: 'intersting.duckdns.org',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'intersting.duckdns.org',
        pathname: '/**',
      },
      {
        // WooCommerce placeholder images
        protocol: 'https',
        hostname: '**.woocommerce.com',
      },
      {
        // Unsplash assets
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Gravatar customer avatars
        protocol: 'https',
        hostname: '**.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
      },
      {
        // Google OAuth user avatars
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  // Logging fetches in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
