import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente. O terceiro parâmetro '' permite carregar todas, 
  // mas o foco é pegar as que começam com VITE_ ou estão no process.env do sistema (CI/CD)
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
      // Isso é crucial: Substitui 'process.env.API_KEY' no código pelo valor real da variável durante o build.
      // Prioriza VITE_API_KEY (padrão Vite/GitHub Action) ou API_KEY direta.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY),
      'process.env': {} // Fallback para evitar erros em outras chamadas process.env
    }
  };
});