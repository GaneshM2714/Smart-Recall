import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Import plugin

export default defineConfig({
  plugins: [
    react(),
    // 👇 ADD THIS SECTION
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Smart Recall',
        short_name: 'SmartRecall',
        description: 'Master your studies with Spaced Repetition',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone', // Hides browser URL bar
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'android-chrome-192x192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['react-window', 'react-virtualized-auto-sizer'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js', // We will create this next
    css: false, // Disable CSS parsing for faster tests
  },
});