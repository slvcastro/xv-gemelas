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
    // Keep Image Optimization well inside the free Hobby allowance: Blob URLs never change
    // (random suffix), so optimized copies can be cached for 31 days, and fewer widths means
    // fewer transformations per photo.
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 828, 1080, 1600],
    imageSizes: [128, 256, 384],
  },
};

export default nextConfig;
