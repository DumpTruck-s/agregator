/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@delivery/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
