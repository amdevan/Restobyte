
// Configuration file for the application

// API Base URL
// Use the environment variable VITE_API_URL if defined, otherwise fallback to localhost
const viteEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed === '/api') return '/api';
  if (trimmed.endsWith('/api')) return trimmed;
  if (trimmed.endsWith('/api/')) return trimmed.slice(0, -1);
  return trimmed.replace(/\/+$/, '') + '/api';
}

const fallbackApiBaseUrl =
  typeof window !== 'undefined'
    ? viteEnv?.DEV
      ? 'http://localhost:3000/api'
      : `${window.location.origin}/api`
    : 'http://localhost:3000/api';

export const API_BASE_URL = viteEnv?.VITE_API_URL ? normalizeApiBaseUrl(viteEnv.VITE_API_URL) : fallbackApiBaseUrl;
