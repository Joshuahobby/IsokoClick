import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  async redirects() {
    // The (auth) route group adds no /auth URL segment; these legacy paths
    // shipped in production links and may still be bookmarked or indexed.
    // Listed individually because /auth/signout is a real route handler —
    // a /auth/:path* wildcard would shadow it.
    return [
      { source: '/auth/login', destination: '/login', permanent: true },
      { source: '/auth/signup', destination: '/signup', permanent: true },
      { source: '/auth/reset-password', destination: '/reset-password', permanent: true },
      { source: '/auth/update-password', destination: '/update-password', permanent: true },
      { source: '/auth/callback', destination: '/callback', permanent: true },
    ]
  },
}

export default nextConfig
