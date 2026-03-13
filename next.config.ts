import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: https://lh3.googleusercontent.com https://images.unsplash.com https://plus.unsplash.com https://api.dicebear.com",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline'",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://payment-stage.ecpay.com.tw https://payment.ecpay.com.tw",
              "connect-src 'self' https://api.cloudflare.com https://oauth2.googleapis.com https://gmail.googleapis.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://payment-stage.ecpay.com.tw https://payment.ecpay.com.tw",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
