/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to allow dynamic route handlers for OG image generation
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon',
      },
    ];
  },
}

module.exports = nextConfig

