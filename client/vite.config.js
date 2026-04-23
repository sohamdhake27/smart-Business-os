import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^lodash\/(.*)$/,
        replacement: path.resolve(__dirname, 'src/shims/lodash/$1.js')
      }
    ]
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
