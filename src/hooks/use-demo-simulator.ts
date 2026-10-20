import { useEffect } from 'react';
import { startDemoSimulator, stopDemoSimulator } from '@/services/demo/simulator';
import { useAuthStore } from '@/stores/auth-store';

export function useDemoSimulator() {
  const isDemo = useAuthStore((state) => state.isDemo);
  useEffect(() => {
    if (!isDemo) {
      stopDemoSimulator();
      return;
    }
    startDemoSimulator();
    return () => stopDemoSimulator();
  }, [isDemo]);
}
