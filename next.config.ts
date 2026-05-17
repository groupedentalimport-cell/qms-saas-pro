import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-16429495-a0ca-48a3-bc2b-2a36f70d8919.space-z.ai",
  ],
};

export default nextConfig;
