/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  transpilePackages: [
    '@polyzone/runtime',
    '@polyzone/core',
  ],
  devIndicators: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.fx$/,
      type: 'asset/source', // This will import the file as a string
    });
    return config;
  },
};

export default nextConfig;
