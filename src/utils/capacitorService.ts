/**
 * Mobile services layer for RestoByte (Capacitor).
 *
 * This module exposes safe wrappers around native Capacitor plugins.
 * Every function degrades gracefully in a normal browser so the existing
 * web application keeps working unchanged (no feature is removed).
 */
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
// @ts-ignore - community QR/barcode scanner, compatible with Capacitor 6
import { BarcodeScanner } from 'capacitor-plugin-qr-barcode-scanner';

// Dev-only override: lets you preview the native-app flow (skip landing, go to /login)
// in a regular browser. Toggle by visiting /?native=1 (set) or /?native=0 (clear).
// Has no effect in production builds. Note: config.ts uses the real Capacitor.isNativePlatform()
// directly, so the API base URL stays on the web fallback (localhost:3000) even when this is on —
// keeping login functional in the desktop browser.
const devForceNative = (() => {
  if (!(import.meta as any).env?.DEV) return false;
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('native') === '1') localStorage.setItem('RB_FORCE_NATIVE', '1');
      else if (params.get('native') === '0') localStorage.removeItem('RB_FORCE_NATIVE');
      return localStorage.getItem('RB_FORCE_NATIVE') === '1';
    }
  } catch { /* ignore */ }
  return false;
})();

export const isNative = Capacitor.isNativePlatform() || devForceNative;
export const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'

/* ----------------------------- Network ----------------------------- */

export async function getNetworkStatus() {
  if (!isNative) {
    return {
      connected: navigator.onLine,
      connectionType: 'unknown',
    };
  }
  return Network.getStatus();
}

export function onNetworkChange(callback: (status: { connected: boolean; connectionType: string }) => void) {
  if (!isNative) {
    const handler = () => callback({ connected: navigator.onLine, connectionType: 'unknown' });
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }
  const listener = Network.addListener('networkStatusChange', (status) => {
    callback({ connected: status.connected, connectionType: status.connectionType });
  });
  return () => {
    listener.then((l) => l.remove()).catch(() => {});
  };
}

/* ----------------------------- Device ------------------------------ */

export async function getDeviceInfo() {
  if (!isNative) {
    return {
      platform: 'web',
      model: navigator.userAgent,
      operatingSystem: 'web',
      osVersion: '',
      uuid: '',
      isVirtual: false,
      manufacturer: 'web',
      webViewVersion: '',
    };
  }
  return Device.getInfo();
}

/* ----------------------------- Storage ----------------------------- */
// Uses Filesystem on native for larger payloads; falls back to localStorage on web.

export async function mobileSet(key: string, value: string): Promise<void> {
  if (!isNative) {
    localStorage.setItem(key, value);
    return;
  }
  await Filesystem.writeFile({
    path: `restobyte/${key}.txt`,
    data: value,
    directory: Directory.Data,
    recursive: true,
  });
}

export async function mobileGet(key: string): Promise<string | null> {
  if (!isNative) {
    return localStorage.getItem(key);
  }
  try {
    const result = await Filesystem.readFile({
      path: `restobyte/${key}.txt`,
      directory: Directory.Data,
    });
    return typeof result.data === 'string' ? result.data : '';
  } catch {
    return null;
  }
}

export async function mobileRemove(key: string): Promise<void> {
  if (!isNative) {
    localStorage.removeItem(key);
    return;
  }
  try {
    await Filesystem.deleteFile({
      path: `restobyte/${key}.txt`,
      directory: Directory.Data,
    });
  } catch {
    /* ignore missing file */
  }
}

/* --------------------------- Notifications ------------------------- */

export async function scheduleLocalNotification(title: string, body: string, id = Date.now()) {
  if (!isNative) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }
  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: Math.floor(id % 2147483647),
        schedule: { at: new Date(Date.now()) },
      },
    ],
  });
}

export async function requestNotificationPermission() {
  if (!isNative) {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission().catch(() => {});
    }
    return;
  }
  const result = await PushNotifications.requestPermissions();
  return result;
}

/* ----------------------------- Haptics ----------------------------- */

export async function vibrate(style: ImpactStyle = ImpactStyle.Medium) {
  if (!isNative) return;
  try {
    await Haptics.impact({ style });
  } catch {
    /* unsupported */
  }
}

/* ------------------------------ Camera ----------------------------- */

export async function takePhoto(): Promise<string | null> {
  if (!isNative) {
    // Browser fallback: use a file input via a temporary element.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 80,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

export async function pickImage(): Promise<string | null> {
  if (!isNative) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 80,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

/* --------------------------- QR Scanner ---------------------------- */

export async function scanQRCode(): Promise<string | null> {
  if (!isNative) {
    // Web fallback: prompt for manual entry (camera scanning requires HTTPS + user gesture).
    return window.prompt('Enter QR / barcode value:');
  }
  try {
    // @ts-ignore
    await BarcodeScanner.checkPermission({ force: true });
    // @ts-ignore
    await BarcodeScanner.hideBackground();
    // @ts-ignore
    const result = await BarcodeScanner.startScan();
    // @ts-ignore
    await BarcodeScanner.showBackground();
    return result?.hasContent ? result.content : null;
  } catch {
    return null;
  }
}

/* --------------------------- App lifecycle ------------------------- */

export function onAppPause(callback: () => void) {
  if (!isNative) {
    window.addEventListener('beforeunload', callback);
    return () => window.removeEventListener('beforeunload', callback);
  }
  const listener = App.addListener('appStateChange', (state) => {
    if (!state.isActive) callback();
  });
  return () => {
    listener.then((l) => l.remove()).catch(() => {});
  };
}

export function onAppResume(callback: () => void) {
  if (!isNative) return () => {};
  const listener = App.addListener('appStateChange', (state) => {
    if (state.isActive) callback();
  });
  return () => {
    listener.then((l) => l.remove()).catch(() => {});
  };
}

/* ---------------------------- Splash ------------------------------- */

export async function hideSplash() {
  if (!isNative) return;
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}

export async function showSplash() {
  if (!isNative) return;
  try {
    await SplashScreen.show();
  } catch {
    /* ignore */
  }
}

export default {
  isNative,
  platform,
  getNetworkStatus,
  onNetworkChange,
  getDeviceInfo,
  mobileSet,
  mobileGet,
  mobileRemove,
  scheduleLocalNotification,
  requestNotificationPermission,
  vibrate,
  takePhoto,
  pickImage,
  scanQRCode,
  onAppPause,
  onAppResume,
  hideSplash,
  showSplash,
};
