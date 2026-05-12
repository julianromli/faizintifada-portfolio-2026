import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR can be disabled by setting DISABLE_HMR=true.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '^/api': {
        target: `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`,
        changeOrigin: true,
      },
    },
  },
});
