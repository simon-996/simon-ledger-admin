import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});
