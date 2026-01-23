
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Plugin khusus untuk membuat file _redirects otomatis setelah build selesai
// Ini mengatasi masalah kegagalan pembuatan file manual
const generateRedirects = () => {
  return {
    name: 'generate-redirects',
    closeBundle() {
      const redirectContent = '/* /index.html 200';
      const outputPath = path.resolve(__dirname, 'dist', '_redirects');
      try {
        fs.writeFileSync(outputPath, redirectContent);
        console.log(`✓ Successfully generated _redirects for Cloudflare at ${outputPath}`);
      } catch (error) {
        console.error('Failed to generate _redirects:', error);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), generateRedirects()],
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
