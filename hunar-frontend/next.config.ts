import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

function apiOrigin(): URL {
  const fallback = "http://localhost:4000";
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? fallback);
  } catch {
    return new URL(fallback);
  }
}

const origin = apiOrigin();

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: origin.protocol.replace(":", "") as "http" | "https",
        hostname: origin.hostname,
        port: origin.port,
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${origin.origin}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${origin.origin}/uploads/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
