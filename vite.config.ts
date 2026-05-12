import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'World Cup Stickers Tracker',
        short_name: 'WC Stickers',
        description: 'Offline-first tracker for the 2026 World Cup sticker collection',
        theme_color: '#0b6e4f',
        background_color: '#f6f3ea',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
