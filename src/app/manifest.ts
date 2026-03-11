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
                src: '/web-app-manifest-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/web-app-manifest-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
