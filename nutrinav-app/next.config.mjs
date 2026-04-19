/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow JSON imports in app directory
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Suppress leaflet SSR warnings
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
}

export default nextConfig;
