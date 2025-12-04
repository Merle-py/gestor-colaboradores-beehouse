import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // Enable React strict mode for better debugging
    reactStrictMode: true,

    // Optimize images
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
        ],
    },
}

export default nextConfig
