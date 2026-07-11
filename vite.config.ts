
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
          includeAssets: ['fevicon.png'],
          manifestFilename: 'manifest.json',
          manifest: {
            short_name: 'RestoByte',
            name: 'RestoByte Restaurant Management',
            start_url: '/',
            display: 'fullscreen',
            background_color: '#ffffff',
            theme_color: '#0ea5e9',
            icons: [
              {
                src: '/icons/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/pwa-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          }
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
