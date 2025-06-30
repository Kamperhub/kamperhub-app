/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Apply Content-Security-Policy headers in all environments to ensure consistency
    const cspHeader = [
      "default-src 'self'",
      // Scripts - Add all known Stripe domains
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://js.stripe.com https://m.stripe.network https://*.stripe.com https://*.cloudworkstations.googleusercontent.com",
      // Styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images - Add Stripe images
      "img-src 'self' data: https://placehold.co https://firebasestorage.googleapis.com https://maps.gstatic.com https://maps.googleapis.com *.googleusercontent.com https://*.stripe.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connections - Add all known Stripe domains
      "connect-src 'self' https://*.googleapis.com wss://*.cloudworkstations.dev https://api.stripe.com https://m.stripe.network https://*.stripe.com https://*.cloudworkstations.googleusercontent.com",
      // Workers
      "worker-src 'self' blob: *.cloudworkstations.googleusercontent.com",
      // Frames - Add all known Stripe domains for iframes
      "frame-src 'self' https://www.google.com https://js.stripe.com https://hooks.stripe.com https://billing.stripe.com https://m.stripe.network https://*.stripe.com https://www.youtube.com https://*.cloudworkstations.googleusercontent.com",
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
