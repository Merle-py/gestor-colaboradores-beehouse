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
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Reduce bundle size in production
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 100000,
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Common component chunk
                        common: {
                            name: 'common',
                            minChunks: 2,
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                    },
                },
            }
        }

        // Suppress webpack cache warnings in dev
        if (dev) {
            config.infrastructureLogging = {
                level: 'error',
            }
        }

        return config
    },

    // Experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
    },

    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Reduce source map size in dev
    productionBrowserSourceMaps: false,
}

export default nextConfig
