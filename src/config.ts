
// Configuration file for the application

// API Base URL
// Use the environment variable VITE_API_URL if defined, otherwise fallback to localhost
const viteEnv = (import.meta as any).env as Record<string, string | undefined> | undefined;
const fallbackApiBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api';

export const API_BASE_URL = viteEnv?.VITE_API_URL || fallbackApiBaseUrl;
