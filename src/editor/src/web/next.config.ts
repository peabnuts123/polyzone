import path from 'path';
import { cwd, argv } from 'process';
import { NextConfig } from 'next';

/**
 * Which bundler to use.
 * Parsed from the process environment to check whether `next` was run with `--turbopack`.
 */
const Bundler = argv.includes('--turbopack') || process.env['TURBOPACK'] ? 'turbopack' : 'webpack';
console.log(`Using bundler: '${Bundler}'`);

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  transpilePackages: [
    '@polyzone/runtime',
    '@polyzone/core',
  ],
  devIndicators: false,

  // @NOTE Ridiculous check to find where `next` is installed (causes havoc in monorepos)
  outputFileTracingRoot: path.join(cwd(), '../../../..'),
};

if (Bundler === 'webpack') {
  /* Webpack config */
  nextConfig.webpack = (config) => {
    config.module.rules.push({
      test: /\.fx$/,
      type: 'asset/source', // This will import the file as a string
    });
    return config;
  };
} else if (Bundler === 'turbopack') {
  /* Turbopack config */
  nextConfig.turbopack = {
    rules: {
      '**/*.fx': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  };
}

export default nextConfig;
