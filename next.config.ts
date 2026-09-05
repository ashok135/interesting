import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        // Allow images from your local WooCommerce
        protocol: 'http',
        hostname: 'interesting.local',
        pathname: '/wp-content/uploads/**',
      },
      {
        // Allow WooCommerce placeholder images
        protocol: 'https',
        hostname: '**.woocommerce.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  // Enable ISR revalidation logging in dev
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
