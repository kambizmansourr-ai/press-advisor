import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // fully static export so the app can be served locally (or opened as a PWA)
  // with zero server-side runtime, which is required for true offline use.
  output: "export",
  trailingSlash: true,
  images: {
    // the Next.js Image Optimization API needs a server; static export has none.
    unoptimized: true,
  },
};

export default nextConfig;
