
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.nostr.build', 'nostr.build', 'i.imgur.com', 'void.cat', 'cdn.discordapp.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // This is required for our existing files in src/ directory
  transpilePackages: ['@/components', '@/hooks', '@/contexts', '@/lib'],
  webpack: (config) => {
    // Important: this allows our old components to work with the App Router
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      // Add any other Node.js core modules your project might require
    };
    
    return config;
  },
};

export default nextConfig;
