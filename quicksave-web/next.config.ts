import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      // You can add your AWS S3 or Cloudinary buckets here later!
    ],
  },
  //  Disable React Strict Mode double-rendering in production 
  // to prevent Socket.io from connecting twice on initial load.
  reactStrictMode: false,
};

export default nextConfig;
