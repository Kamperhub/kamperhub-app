
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async headers() {
    const cspHeader = [
      "default-src 'self'",
      // Scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://js.stripe.com",
      // Styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images
      "img-src 'self' data: https://placehold.co https://firebasestorage.googleapis.com https://maps.gstatic.com https://maps.googleapis.com *.googleusercontent.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connections
      "connect-src 'self' https://*.googleapis.com wss://*.cloudworkstations.dev https://api.stripe.com",
      // Workers
      "worker-src 'self' blob: *.cloudworkstations.googleusercontent.com",
      // Frames
      "frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com https://www.youtube.com",
      // Others
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
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
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      }
    ],
  },
};

export default nextConfig;
