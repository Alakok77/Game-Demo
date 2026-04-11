import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Game-Demo",
  assetPrefix: "/Game-Demo/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;