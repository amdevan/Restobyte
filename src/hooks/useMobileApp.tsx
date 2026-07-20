import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ImpactStyle } from '@capacitor/haptics';
import CapacitorMobile from '@/utils/capacitorService';

interface MobileContextValue {
  isNative: boolean;
  platform: string;
  isOnline: boolean;
  connectionType: string;
  /** Light haptic feedback (no-op on web). */
  haptic: (style?: 'light' | 'medium' | 'heavy') => void;
  /** Hide the native splash screen once the app is ready. */
  ready: () => void;
}

const MobileContext = createContext<MobileContextValue>({
  isNative: false,
  platform: 'web',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown',
  haptic: () => {},
  ready: () => {},
});

export const useMobile = () => useContext(MobileContext);

const styleMap = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
};

export const MobileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState('unknown');
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Tag the <body> so global mobile-only CSS rules (body.is-native ...) activate.
    if (CapacitorMobile.isNative && typeof document !== 'undefined') {
      document.body.classList.add('is-native');
    }

    const init = async () => {
      const info = await CapacitorMobile.getDeviceInfo().catch(() => null);
      void info;

      // Network monitoring (native + web).
      const unsub = CapacitorMobile.onNetworkChange((status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      });
      cleanup = unsub;

      // Prime initial status.
      const status = (await CapacitorMobile.getNetworkStatus().catch(() => null)) as {
        connected: boolean;
        connectionType: string;
      } | null;
      if (status) {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      }

      // Request notification permission on native.
      if (CapacitorMobile.isNative) {
        await CapacitorMobile.requestNotificationPermission().catch(() => {});
      }
    };

    void init();

    return () => {
      cleanup?.();
    };
  }, []);

  const haptic = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    void CapacitorMobile.vibrate(styleMap[style]);
  }, []);

  const ready = useCallback(() => {
    setAppReady(true);
    void CapacitorMobile.hideSplash();
  }, []);

  // Auto-hide splash shortly after mount if not explicitly called.
  useEffect(() => {
    if (appReady) return;
    const t = setTimeout(() => {
      void CapacitorMobile.hideSplash();
    }, 2500);
    return () => clearTimeout(t);
  }, [appReady]);

  return (
    <MobileContext.Provider
      value={{
        isNative: CapacitorMobile.isNative,
        platform: CapacitorMobile.platform,
        isOnline,
        connectionType,
        haptic,
        ready,
      }}
    >
      {children}
      {!isOnline && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#dc2626',
            color: '#fff',
            textAlign: 'center',
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          No internet connection — running offline
        </div>
      )}
    </MobileContext.Provider>
  );
};

export default MobileProvider;
