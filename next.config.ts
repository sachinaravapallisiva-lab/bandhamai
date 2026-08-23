import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "stripe", "pdf-lib"],
};

export default nextConfig;
