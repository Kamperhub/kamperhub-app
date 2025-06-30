/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Only apply Content-Security-Policy headers in production
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
  
    const cspHeader = [
      "default-src 'self'",
      // Scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://js.stripe.com https://hooks.stripe.com https://billing.stripe.com https://*.cloudworkstations.googleusercontent.com",
      // Styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images
      "img-src 'self' data: https://placehold.co https://firebasestorage.googleapis.com https://maps.gstatic.com https://maps.googleapis.com *.googleusercontent.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connections
      "connect-src 'self' https://*.googleapis.com wss://*.cloudworkstations.dev https://api.stripe.com https://hooks.stripe.com https://billing.stripe.com https://*.cloudworkstations.googleusercontent.com",
      // Workers
      "worker-src 'self' blob: *.cloudworkstations.googleusercontent.com",
      // Frames
      "frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com https://billing.stripe.com https://www.youtube.com https://*.cloudworkstations.googleusercontent.com",
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

module.exports = nextConfig;
