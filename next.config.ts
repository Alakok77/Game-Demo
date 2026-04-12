import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Game-Demo",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;