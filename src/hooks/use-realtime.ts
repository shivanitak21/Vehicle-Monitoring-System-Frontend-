import { useEffect } from 'react';
import { startRealtime, stopRealtime } from '@/services/realtime';
import { useAuthStore } from '@/stores/auth-store';
import { useLiveStore } from '@/stores/live-store';

export function useRealtime() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const token = useAuthStore((state) => state.token);
  useEffect(() => {
    if (isDemo || !token) {
      stopRealtime();
      if (!isDemo) useLiveStore.getState().setConnection(token ? 'offline' : 'idle');
      return;
    }
    startRealtime(token);
    return () => stopRealtime();
  }, [isDemo, token]);
}
