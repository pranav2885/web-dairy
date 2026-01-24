import { useState, useEffect } from 'react';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // TODO: Connect to actual sync engine
  // For now, simulate synced status when online
  useEffect(() => {
    if (isOnline) {
      setStatus('synced');
    } else {
      setStatus('idle');
    }
  }, [isOnline]);

  return { status, setStatus, isOnline };
}
