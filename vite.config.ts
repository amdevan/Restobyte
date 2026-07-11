
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url'; // Added for ES module __dirname equivalent
import packageJson from './package.json';

// ES module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const allowedHosts: string[] = [];
    if (env.COOLIFY_FQDN) allowedHosts.push(env.COOLIFY_FQDN);
    if (env.COOLIFY_FQDN && env.COOLIFY_FQDN.endsWith('.sslip.io')) allowedHosts.push('.sslip.io');
    return {
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          manifest: false,
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
            navigateFallback: 'index.html',
          },
          includeAssets: [
            'fevicon.png',
            'icons/pwa-192x192.png',
            'icons/pwa-512x512.png',
            'icons/pwa-maskable-512x512.png'
          ]
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.APP_VERSION': JSON.stringify(packageJson.version)
      },
      server: {
        allowedHosts,
        historyApiFallback: true,
      },
      preview: {
        allowedHosts,
        historyApiFallback: true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src')
        }
      }
    };
});
