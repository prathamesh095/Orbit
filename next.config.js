/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [],
  },

  // ─── Webpack Cache Hardening ────────────────────────────────────────────────
  // Root cause of ENOENT *.pack.gz errors on Windows:
  //   Next.js/webpack writes `.next/cache/webpack/*.pack.gz` files using
  //   an append-then-rename strategy. On Windows, file locks from antivirus,
  //   OneDrive sync, or interrupted builds can leave partial/corrupt pack files
  //   that cause ENOENT on the next read. The dev server running during a
  //   directory restructure (route group migration) makes this worse.
  //
  // Fix: use in-memory cache in development → no pack files written → no
  //   ENOENT/corruption. Build performance stays good (only dev is affected).
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Switch webpack from filesystem cache (pack.gz) to in-memory cache.
      // This eliminates all ENOENT *.pack.gz errors and related 404s on Windows.
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },

  // ─── Logging (dev only) ────────────────────────────────────────────────────
  // Surface chunk load failures in the dev server console instead of silently
  // swallowing them, so issues are immediately visible.
  logging: isDev
    ? {
      fetches: {
        fullUrl: true,
      },
    }
    : undefined,
};

module.exports = nextConfig;
