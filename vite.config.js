import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // 업데이트 발생 시 사용자에게 확인 후 적용 (prompt 방식)
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'FitLink - PT 매니저',
        short_name: 'FitLink',
        description: '개인 트레이닝(PT) 세션을 관리하는 모바일 웹앱',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ko',
        dir: 'ltr',
        background_color: '#FFFFFF',
        theme_color: '#007AFF',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // JS, CSS, HTML, 이미지 파일을 프리캐시 대상으로 포함
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // OAuth PKCE code exchange 가로채기 방지 — /auth/callback은 네트워크 직접 처리
        navigateFallbackDenylist: [/^\/auth\/callback/],
        runtimeCaching: [
          {
            // Supabase REST API 응답을 NetworkFirst 전략으로 캐시 (5분 TTL, 최대 50건)
            urlPattern: /^https:\/\/.*supabase.*\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  esbuild: {
    pure: ['console.log', 'debugger'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
