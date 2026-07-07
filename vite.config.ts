
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.APP_VERSION': JSON.stringify(packageJson.version)
      },
      preview: {
        allowedHosts,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src')
        }
      }
    };
});
