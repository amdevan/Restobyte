
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

function resolveApiBaseUrl(): string {
  // Native builds: prefer an explicit native override, otherwise the platform default.
  if (Capacitor.isNativePlatform()) {
    if (viteEnv?.VITE_NATIVE_API_URL) return normalizeApiBaseUrl(viteEnv.VITE_NATIVE_API_URL);
    return nativeDefaultApiBaseUrl();
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
