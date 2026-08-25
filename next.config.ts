import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
