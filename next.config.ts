/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许本地上传的图片
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
  // 服务器独立部署（deploy/setup.sh 用），产物在 .next/standalone
  output: "standalone",
};

export default nextConfig;
