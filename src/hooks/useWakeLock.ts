import { useEffect, useRef } from 'react';

/**
 * Hook to keep the screen awake during cooking mode
 * Uses the Screen Wake Lock API to prevent the screen from dimming or turning off
 */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let isActive = true;

    const requestWakeLock = async () => {
      // Check if Wake Lock API is supported
      if (!('wakeLock' in navigator)) {
        console.warn('Wake Lock API is not supported in this browser');
        return;
      }

      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');

        // Listen for wake lock release
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
      } catch (error) {
        console.error('Failed to acquire Wake Lock:', error);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive) {
        // Re-acquire wake lock when page becomes visible again
        await requestWakeLock();
      }
    };

    // Request wake lock when component mounts
    requestWakeLock();

    // Re-acquire wake lock when user returns to the page
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Release wake lock when component unmounts
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          console.log('Wake Lock released on cleanup');
        });
      }
    };
  }, []);

  return {
    isSupported: 'wakeLock' in navigator,
    wakeLock: wakeLockRef.current,
  };
}
