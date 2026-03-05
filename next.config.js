/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [],
    unoptimized: process.env.DOCKER === '1',
  },
};

module.exports = nextConfig;
