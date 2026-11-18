import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
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
  async redirects() {
    return [
      { source: '/order', destination: '/account', permanent: false },
      { source: '/orders', destination: '/account', permanent: false },
      { source: '/track', destination: '/account', permanent: false },
      { source: '/track-order', destination: '/account', permanent: false },
      { source: '/order-tracking', destination: '/account', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

export default nextConfig;
