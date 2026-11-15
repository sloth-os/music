import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Cadence: The Lost Symphony',
        short_name: 'Cadence',
        description:
          'A story-driven adventure through music history. Recover six Echoes, learn to listen, and restore the lost symphony.',
        theme_color: '#f9f8f4',
        background_color: '#f9f8f4',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2,mp3}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
})
