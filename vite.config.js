import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Tres salidas con el mismo código:
//  · vite build            → dist/ : web (GitHub Pages, sin conexión tras la primera visita) y app Android (Capacitor)
//  · vite build --mode pc  → build-pc/ : se convierte en un único Diapason.html que se abre con doble clic
export default defineConfig(({ mode }) => {
  const pc = mode === 'pc';
  return {
    plugins: [
      react(),
      !pc &&
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: null, // se registra en main.jsx solo en la web
          manifest: false, // se usa public/manifest.webmanifest
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
            navigateFallback: 'index.html',
            cleanupOutdatedCaches: true,
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          },
        }),
    ].filter(Boolean),
    base: './',
    server: { port: 5173, open: true },
    build: pc
      ? {
          outDir: 'build-pc',
          emptyOutDir: true,
          cssCodeSplit: false,
          assetsInlineLimit: 100_000_000, // tipografías e imágenes dentro del propio archivo
          rollupOptions: { output: { inlineDynamicImports: true } },
        }
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                react: ['react', 'react-dom', 'react-router-dom'],
                charts: ['recharts'],
              },
            },
          },
        },
  };
});
