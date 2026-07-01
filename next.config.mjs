/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/csui-course-visualizer' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
