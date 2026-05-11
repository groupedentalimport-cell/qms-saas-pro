import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    include: [
      'src/__tests__/unit/**/*.test.ts',
      'src/__tests__/unit/**/*.test.tsx',
      'src/__tests__/integration/**/*.test.ts',
      'src/__tests__/integration/**/*.test.tsx',
      'src/__tests__/component/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'src/lib/mock-data.ts',
        'src/lib/i18n/**',
        '**/*.d.ts',
      ],
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
