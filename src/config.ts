
// Configuration file for the application

// API Base URL
// Resolution order:
//   1. VITE_NATIVE_API_URL (explicit override for native app builds — e.g. a real-device LAN IP like http://192.168.1.5:3000)
//   2. VITE_API_URL (general override — used by web dev/prod)
//   3. Native platform default:
//        - Android: http://10.0.2.2:3000/api  (10.0.2.2 is the emulator's alias for the host loopback)
//        - iOS:     http://localhost:3000/api (iOS simulator shares loopback with the host)
//   4. Web fallback: localhost:3000 in dev, window.location.origin/api in prod
import { Capacitor } from '@capacitor/core';

const viteEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed === '/api') return '/api';
  if (trimmed.endsWith('/api')) return trimmed;
  if (trimmed.endsWith('/api/')) return trimmed.slice(0, -1);
  return trimmed.replace(/\/+$/, '') + '/api';
}

function nativeDefaultApiBaseUrl(): string {
  const platform = Capacitor.getPlatform();
  // Android emulator: 10.0.2.2 maps to the host machine's loopback. Real devices need VITE_NATIVE_API_URL.
  if (platform === 'android') return 'http://10.0.2.2:3000/api';
  // iOS simulator shares the host's loopback. Real devices need VITE_NATIVE_API_URL.
  return 'http://localhost:3000/api';
}

// Resolve the native API base URL at MODULE TOP-LEVEL (unconditionally) so Vite
// statically inlines VITE_NATIVE_API_URL into the bundle. If this were only read
// inside the `if (Capacitor.isNativePlatform())` branch, the minifier would
// dead-code-eliminate it during the web build and the production URL would be lost.
const NATIVE_API_BASE_URL: string =
  (import.meta.env.VITE_NATIVE_API_URL as string | undefined)
    ? normalizeApiBaseUrl(import.meta.env.VITE_NATIVE_API_URL as string)
    : nativeDefaultApiBaseUrl();

function resolveApiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_API_BASE_URL;
  }
  // Web: prefer VITE_API_URL, otherwise dev/prod fallback.
  if (viteEnv?.VITE_API_URL) return normalizeApiBaseUrl(viteEnv.VITE_API_URL);
  return typeof window !== 'undefined'
    ? viteEnv?.DEV
      ? 'http://localhost:3000/api'
      : `${window.location.origin}/api`
    : 'http://localhost:3000/api';
}

export const API_BASE_URL = resolveApiBaseUrl();
