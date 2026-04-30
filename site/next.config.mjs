/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', '127.0.0.1:3000', '127.0.0.1:3001'],
    },
  },
};

export default nextConfig;
