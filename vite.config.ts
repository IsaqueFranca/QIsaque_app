import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente. O terceiro parâmetro '' permite carregar todas.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', // Garante caminhos relativos para GitHub Pages
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    define: {
      // Injeta a variável VITE_API_KEY como process.env.API_KEY no código compilado
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY),
      // Polyfill simples para evitar que outras bibliotecas quebrem ao acessar process.env
      'process.env': {}
    }
  };
});