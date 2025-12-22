import type { NextConfig } from "next";

const nextConfig: any = {
  /* config options here */

  images: {
    unoptimized: true, // Keep this if you want to avoid Image Optimization costs/complexity, or remove for default optimization
  },
};

export default nextConfig;
