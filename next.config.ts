import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Instagram CDN and Firebase Storage images use plain <img> tags, so the
  // Next image optimizer is disabled for Cloud Run portability.
  images: { unoptimized: true },
  // Google Cloud client packages load generated JSON at runtime; keep them
  // external in the Node.js Cloud Run bundle rather than webpack inlining them.
  serverExternalPackages: ['@google-cloud/tasks'],
};

export default nextConfig;
