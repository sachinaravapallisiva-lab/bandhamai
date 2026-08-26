import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["sharp", "stripe", "pdf-lib"],
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/login?mode=signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
