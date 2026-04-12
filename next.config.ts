import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: "/Game-Demo",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;