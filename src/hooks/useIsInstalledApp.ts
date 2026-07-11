import { useEffect, useState } from 'react';

const DISPLAY_MODE_QUERY = '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)';

function getInstalledAppState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const isIosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia(DISPLAY_MODE_QUERY).matches || isIosStandalone;
}

export function useIsInstalledApp(): boolean {
  const [isInstalledApp, setIsInstalledApp] = useState(() => getInstalledAppState());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(DISPLAY_MODE_QUERY);
    const updateInstalledState = () => setIsInstalledApp(getInstalledAppState());

    updateInstalledState();
    mediaQuery.addEventListener('change', updateInstalledState);
    window.addEventListener('appinstalled', updateInstalledState);

    return () => {
      mediaQuery.removeEventListener('change', updateInstalledState);
      window.removeEventListener('appinstalled', updateInstalledState);
    };
  }, []);

  return isInstalledApp;
}
