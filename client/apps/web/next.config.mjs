/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@workspace/ui"],

    images: {
        unoptimized: process.env.NODE_ENV === "development",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "isnjgdlkycxgmsfvvupv.storage.supabase.co",
                pathname: "/room_images/**",
            },
        ],
    },
};

export default nextConfig;
