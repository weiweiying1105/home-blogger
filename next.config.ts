/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许本地上传的图片
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
};
export default nextConfig;
