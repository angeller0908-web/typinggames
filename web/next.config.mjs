import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: { unoptimized: true },
  experimental: {
    mdxRs: false,
  },
};

export default withMDX(nextConfig);
