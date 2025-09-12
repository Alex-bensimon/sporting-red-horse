/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // Autorise les popups tiers (Google Auth) à se fermer sans avertissement
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ]
  },
}
module.exports = nextConfig

