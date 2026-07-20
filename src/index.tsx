
import React from 'react';
import ReactDOM from 'react-dom/client';
// CRITICAL: this import is what makes Vite compile Tailwind + the global
// mobile styles into the production build. Without it the app ships with NO
// CSS at all (it previously relied on the runtime Tailwind Play CDN, which is
// unreliable / offline-broken inside the native WebView).
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
