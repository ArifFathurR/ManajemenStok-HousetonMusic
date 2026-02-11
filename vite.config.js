import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            outDir: 'public/build', // Output to public/build for Laravel
            manifest: {
                name: 'Manajemen Stok Houston',
                short_name: 'Houston POS',
                description: 'Aplikasi Manajemen Stok dan Kasir Houston Music',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/images/logo-houston.png', // Using existing logo as placeholder, user should replace with proper sizes
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/images/logo-houston.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/images/logo-houston.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    }
                ],
            },
            workbox: {
                // Workbox options for caching
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 1 day
                            },
                        },
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/storage'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                            },
                        },
                    }
                ]
            },
            devOptions: {
                enabled: true
            } 
        }),
    ],
});
