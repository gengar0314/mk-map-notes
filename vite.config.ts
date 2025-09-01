import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages の /<repo>/ サブパスに置く場合は base を '/<repo>/' にする
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/mk-map-notes/' : '/',
});
