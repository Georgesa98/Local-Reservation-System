/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "isnjgdlkycxgmsfvvupv.storage.supabase.co",
        pathname: "/room_images/**",
      },
    ],
  },
}

export default nextConfig
