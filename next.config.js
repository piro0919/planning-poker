const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = require("next-intl/plugin")();

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    appDir: true,
    scrollRestoration: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  sassOptions: {
    additionalData: async (content, { resourcePath }) => {
      if (resourcePath.includes("node_modules")) {
        return content;
      }

      if (resourcePath.endsWith("mq-settings.scss")) {
        return process.env.NODE_ENV === "production" ? "" : content;
      }

      return "@use '@/styles/mq' as mq;" + content;
    },
  },
};

module.exports = (_, { defaultConfig }) => {
  const plugins = [withNextIntl, withPWA, withBundleAnalyzer];

  return plugins.reduce((acc, next) => next(acc), {
    ...defaultConfig,
    ...nextConfig,
  });
};
