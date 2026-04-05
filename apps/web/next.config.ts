import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kiado/shared"],
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
