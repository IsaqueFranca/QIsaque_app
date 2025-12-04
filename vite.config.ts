import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // 'base' deve ser './' para funcionar em qualquer subpasta (como no GitHub Pages)
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    define: {
      // Isso previne o erro "process is not defined" no navegador que algumas libs legadas podem causar
      'process.env': {}
    }
  };
});