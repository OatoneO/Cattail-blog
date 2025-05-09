/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      // { hostname: "cdn.sanity.io" },
      { hostname: "raw.githubusercontent.com" },
      { hostname: "github.com" },
      { hostname: "avatars.githubusercontent.com" }
    ],
  },
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
};

export default nextConfig;
