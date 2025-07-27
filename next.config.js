/** @type {import('next').NextConfig} */
const nextConfig = {
  // allowedDevOrigins moved from here (root level)

  devIndicators: {
    allowedDevOrigins: [
      'https://3000-firebase-studio-1748946751962.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev', // The exact URL
    ],
  },

  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
  },
  experimental: {
    instrumentationHook: false, // This disables Next.js's default OpenTelemetry instrumentation
    serverActions: {
      bodySizeLimit: '2mb', // Increase body size limit for potential large payloads
    },
    // allowedDevOrigins remains REMOVED from this block
  },
  webpack: (config, { dev, isServer }) => {
    // Enable WebAssembly experiments to support all package features.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // In some environments, file system watching is unreliable.
    // Polling is a more robust, albeit slightly more resource-intensive, method to detect changes.
    // This is a common fix for HMR (Fast Refresh) issues in containerized/cloud dev environments.
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second.
        aggregateTimeout: 300, // Delay before rebuilding.
      };
    }
    return config;
  },
  async headers() {
    // Apply Content-Security-Policy headers in all environments to ensure consistency
    const cspHeader = [
      "default-src 'self'",
      // Scripts - Allow self, inline, eval (for Next.js), Google Maps, Stripe, and Cloud IDE resources
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.google.com https://www.gstatic.com https://*.stripe.com https://m.stripe.network https://*.cloudworkstations.googleusercontent.com https://vscode-resource.vscode-cdn.net https://*.cloudworkstations.dev",
      // Styles - Allow self, inline (for component libraries), and Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images - Allow self, data URIs, placeholders, Firebase Storage, Google content, and Stripe
      "img-src 'self' data: https://placehold.co https://firebasestorage.googleapis.com https://maps.gstatic.com https://maps.googleapis.com https://*.googleusercontent.com https://*.stripe.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connections - Allow self, Google APIs, local dev server, Stripe, and Cloud IDE resources, including websockets
      "connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.cloudworkstations.dev https://*.cloudworkstations.dev https://*.stripe.com https://m.stripe.network https://*.cloudworkstations.googleusercontent.com wss://*.cloudworkstations.googleusercontent.com https://vscode-resource.vscode-cdn.net",
      // Workers - Allow self, blobs, and Cloud IDE resources
      "worker-src 'self' blob: https://*.cloudworkstations.googleusercontent.com https://vscode-resource.vscode-cdn.net",
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
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
