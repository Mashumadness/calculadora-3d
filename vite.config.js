import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En GitHub Pages la app vive en /calculadora-3d/, en local en la raiz.
const base = process.env.GITHUB_ACTIONS ? '/calculadora-3d/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173, open: true },
});
