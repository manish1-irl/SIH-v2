/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://sih-v2-2yz4.onrender.com"
        : "http://localhost:8000");
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
