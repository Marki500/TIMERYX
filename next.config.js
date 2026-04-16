/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    disable: false, // Ensure testing works even locally if needed, but normally we disable in dev
    workboxOptions: {
        disableDevLogs: true,
    },
});

const nextConfig = {
    images: {
        domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    },
}

module.exports = withPWA(nextConfig)
