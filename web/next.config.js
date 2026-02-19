/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Allow importing from worker package for shared utilities
    transpilePackages: [],
}

module.exports = nextConfig
