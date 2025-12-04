import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env ou dos Secrets do GitHub
  const env = loadEnv(mode, process.cwd(), '');

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
      // Isso previne o erro "process is not defined" no navegador
      'process.env': {},
      // Injeta a API Key especificamente
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});