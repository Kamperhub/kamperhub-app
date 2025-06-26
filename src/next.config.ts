// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'https://8081-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev' // <--- THIS LINE MUST BE EXACTLY THIS
  ],
  // Keep any other Next.js configurations you might have here
  // e.g., reactStrictMode: true,
};

export default nextConfig;

