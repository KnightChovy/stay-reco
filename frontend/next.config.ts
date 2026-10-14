import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @stayreco/shared is symlinked from ../packages, outside this app's folder.
  turbopack: { root: path.resolve(__dirname, '..') },
  async redirects() {
    return [
      { source: '/payment', destination: '/booking/payment', permanent: true },
      { source: '/booking-confirmation', destination: '/booking/confirmation', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
