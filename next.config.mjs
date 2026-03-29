/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // pdf-parse uses Node.js built-ins; keep it in the server bundle
  serverExternalPackages: ["pdf-parse"],
}

export default nextConfig
