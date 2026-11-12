import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Lets a test build go to its own folder so it never clashes with `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
