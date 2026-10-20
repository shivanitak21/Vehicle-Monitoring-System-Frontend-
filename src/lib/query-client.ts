import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      refetchOnReconnect: true,
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (process.env.EXPO_OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', onAppStateChange);
