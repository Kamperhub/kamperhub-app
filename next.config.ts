
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      'https://3000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev',
      'https://3001-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev',
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
