import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Scope coverage to business logic files with unit tests.
      // React UI components (pages/, components/, App.tsx) are excluded —
      // they require full browser rendering and are covered by manual QA.
      include: [
        'src/engine/**/*.ts',
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
        'src/data/index.ts',
      ],
    },
  },
})
