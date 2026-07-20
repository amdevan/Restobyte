import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restobyte.app',
  appName: 'RestoByte',
  webDir: 'dist',
  server: {
    // Allow the WebView to make HTTP (non-HTTPS) requests to the backend.
    // Required for dev/emulator builds where the Node backend is served over plain HTTP
    // (e.g. http://10.0.2.2:3000 from the Android emulator, http://localhost:3000 from iOS sim).
    // For production real-device builds, deploy the backend behind HTTPS and set
    // VITE_NATIVE_API_URL to the HTTPS endpoint — then this can be removed.
    cleartext: true,
    // Load the WebView itself over HTTP so that fetching the plain-HTTP backend
    // (http://10.0.2.2:3000/api on Android emulator, http://localhost:3000/api on iOS sim)
    // is NOT treated as "active mixed content" (which WebView blocks even with
    // usesCleartextTraffic=true when the page is served via https://).
    // For production real-device builds, deploy the backend behind HTTPS, remove
    // these scheme overrides, and set VITE_NATIVE_API_URL to the HTTPS endpoint.
    androidScheme: 'http',
    iosScheme: 'http',
    // Used for live-reload during mobile development.
    // Point this at your dev machine IP when running `npm run dev` and testing on-device.
    // Example: 'http://192.168.1.10:5173'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0ea5e9',
      androidScaleType: 'CENTER_CROP',
      iosResizeMode: 'contain',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Camera: {
      // Photos are stored in the app sandbox, no extra permission prompt needed on iOS.
      // Set to 'public' if you want photos to appear in the device gallery.
    },
  },
};

export default config;
