import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';
import path from 'path';
import type { ProxyOptions } from 'vite';
import {defineConfig} from 'vite';

const apiProxy: ProxyOptions = {
  target: `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`,
  changeOrigin: true,
  configure(proxy) {
    proxy.on('proxyReq', (proxyReq, req) => {
      const src = req as IncomingMessage;
      const auth = src.headers.authorization;
      if (typeof auth === 'string' && proxyReq.getHeader('authorization') == null) {
        proxyReq.setHeader('Authorization', auth);
      }
      const cms = src.headers['x-portfolio-cms-token'];
      if (typeof cms === 'string' && proxyReq.getHeader('x-portfolio-cms-token') == null) {
        proxyReq.setHeader('x-portfolio-cms-token', cms);
      }
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // Allow Cloudflare/ngrok tunnel hostnames during remote dev preview.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.dev', '.ngrok.io'],
    // HMR can be disabled by setting DISABLE_HMR=true.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '^/api': apiProxy,
    },
  },
});
