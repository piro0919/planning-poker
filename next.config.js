const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = require("next-intl/plugin")();

const withSerwist = require("@serwist/next").default({
  disable: process.env.NODE_ENV === "development",
  swDest: "public/sw.js",
  swSrc: "src/app/sw.ts",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // dev を AI エージェントから走らせると、AGENTS.md と CLAUDE.md を直下に生成する。要らないので止める。
  agentRules: false,
  experimental: {
    scrollRestoration: true,
  },
  async headers() {
    return [
      {
        headers: [
          // ほかのサイトの枠に入れさせない。
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
        source: "/:path*",
      },
    ];
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
  const plugins = [withNextIntl, withSerwist, withBundleAnalyzer];

  return plugins.reduce((acc, next) => next(acc), {
    ...defaultConfig,
    ...nextConfig,
  });
};
