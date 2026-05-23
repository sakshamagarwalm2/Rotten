const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable server-side features for Electron
  trailingSlash: true,
};

export default nextConfig;
