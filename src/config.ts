
// Configuration file for the application

// API Base URL
// Use the environment variable VITE_API_URL if defined, otherwise fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('API_BASE_URL:', API_BASE_URL);

