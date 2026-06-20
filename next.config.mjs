/** @type {import('next').NextConfig} */
const nextConfig = {
    // Hostinger handles the build & serve natively — no standalone needed.
    // The .next/ output directory is auto-detected by Hostinger's Next.js runtime.
    reactStrictMode: true,
    experimental: {
        serverActions: {
            bodySizeLimit: '15mb',
        },
    },
};

export default nextConfig;
