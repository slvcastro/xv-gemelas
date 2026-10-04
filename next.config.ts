import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photos uploaded from the admin panel live in Vercel Blob.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
