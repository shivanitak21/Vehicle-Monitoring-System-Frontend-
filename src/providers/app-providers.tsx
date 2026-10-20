import { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';

export function AppProviders({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    if (useDemoStore.persist.hasHydrated()) {
      useDemoStore.getState().setHydrated(true);
    }
    const unsubscribe = useDemoStore.persist.onFinishHydration(() => {
      useDemoStore.getState().setHydrated(true);
    });
    return unsubscribe;
  }, [hydrate]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
