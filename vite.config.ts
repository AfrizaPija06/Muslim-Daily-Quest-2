
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin untuk membuat fallback SPA (Single Page Application)
// Kita menggunakan strategi "404.html" alih-alih "_redirects"
// karena Cloudflare mendeteksi "/* /index.html 200" sebagai infinite loop pada setup tertentu.
// Dengan menyalin index.html ke 404.html, Cloudflare akan menyajikan aplikasi React
// saat route tidak ditemukan, memungkinkan routing sisi klien bekerja normal.
const generateSpaFallback = () => {
  return {
    name: 'generate-spa-fallback',
    closeBundle() {
      const indexHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
      const fourOhFourPath = path.resolve(__dirname, 'dist', '404.html');
      const redirectsPath = path.resolve(__dirname, 'dist', '_redirects');

      try {
        // 1. Copy index.html -> 404.html
        if (fs.existsSync(indexHtmlPath)) {
          fs.copyFileSync(indexHtmlPath, fourOhFourPath);
          console.log(`✓ Successfully generated 404.html for Cloudflare SPA fallback`);
        } else {
          console.error('index.html not found, cannot generate 404.html');
        }

        // 2. Hapus _redirects jika ada (untuk mencegah error validasi Cloudflare)
        if (fs.existsSync(redirectsPath)) {
          fs.unlinkSync(redirectsPath);
          console.log('✓ Removed problematic _redirects file to prevent validation errors');
        }
      } catch (error) {
        console.error('Failed to generate SPA fallback:', error);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), generateSpaFallback()],
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
