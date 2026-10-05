import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  outputFileTracingIncludes: {
    "/api/eval": [
      "./node_modules/@se-oss/stockfish/dist/**/*",
    ],
  },
};

export default nextConfig;
