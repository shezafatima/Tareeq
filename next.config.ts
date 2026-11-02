import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/about", destination: "/our-way", permanent: true }];
  },
};

export default nextConfig;
