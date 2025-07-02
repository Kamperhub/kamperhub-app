
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Apply Content-Security-Policy headers in all environments to ensure consistency
    const cspHeader = [
      "default-src 'self'",
      // Scripts - Allow self, inline, eval (for Next.js), Google Maps, and Stripe
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://*.stripe.com https://m.stripe.network https://*.cloudworkstations.googleusercontent.com",
      // Styles - Allow self, inline (for component libraries), and Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images - Allow self, data URIs, placeholders, Firebase Storage, Google content, and Stripe
      "img-src 'self' data: https://placehold.co https://firebasestorage.googleapis.com https://maps.gstatic.com https://maps.googleapis.com https://*.googleusercontent.com https://*.stripe.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connections - Allow self, Google APIs, local dev server, and Stripe
      "connect-src 'self' http://localhost:8083 ws://localhost:8083 https://*.googleapis.com wss://*.cloudworkstations.dev https://*.stripe.com https://m.stripe.network https://*.cloudworkstations.googleusercontent.com",
      // Workers
      "worker-src 'self' blob: https://*.cloudworkstations.googleusercontent.com",
      // Frames - Allow self, Google (for Recaptcha/maps), and Stripe (for portal and payment forms)
      "frame-src 'self' https://www.google.com https://*.stripe.com https://billing.stripe.com https://m.stripe.network https://www.youtube.com https://*.cloudworkstations.googleusercontent.com",
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
