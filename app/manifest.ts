import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Timeryx - Work Manager',
    short_name: 'Timeryx',
    description: 'SaaS Project Management & Time Tracking System',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0F0F',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
