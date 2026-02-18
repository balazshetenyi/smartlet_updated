import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kiado/shared"],
  reactCompiler: true,
};

export default nextConfig;
