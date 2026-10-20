import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  if (hydrated && user) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#070B12' } }} />;
}
