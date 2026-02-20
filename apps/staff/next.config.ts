import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  transpilePackages: ['@reservation/ui'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
