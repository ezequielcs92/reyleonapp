import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Rey León - Elenco',
        short_name: 'Rey León',
        description: 'App oficial para el elenco de El Rey León',
        start_url: '/feed',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0c0a08',
        theme_color: '#0c0a08',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
