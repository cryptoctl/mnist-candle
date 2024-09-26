/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  experimental: {
  },
  cleanDistDir: false,
  webpack: (config, options) => {
    config.experiments.asyncWebAssembly = true;
    config.experiments.syncWebAssembly = true;
    config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    return config;
  }
};

export default nextConfig;
