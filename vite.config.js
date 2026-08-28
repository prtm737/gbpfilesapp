import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const base = process.env.BASE_URL || '/gbpfilesapp/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GBP File Tracking System',
        short_name: 'GBP-FTMS',
        description: 'Guwahati Biotech Park - Physical File Tracking & Movement System',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        icons: [
          {
            src: `${base}favicon.svg`,
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: `${base}favicon.svg`,
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})