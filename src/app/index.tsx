import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export default function SplashRoute() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const hasOnboarded = useAuthStore((state) => state.hasOnboarded);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      if (user) router.replace('/home');
      else if (!hasOnboarded) router.replace('/onboarding');
      else router.replace('/login');
    }, 900);
    return () => clearTimeout(timer);
  }, [hydrated, hasOnboarded, router, user]);

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <Animated.View entering={FadeIn.duration(700)} style={styles.copy}>
        <AppText variant="label" tone="lime">
          PASSENGER SAFETY
        </AppText>
        <AppText variant="display">Velora</AppText>
        <View style={styles.rule} />
        <AppText tone="muted">Family journeys, shared only with consent.</AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(214, 255, 74, 0.08)',
  },
  copy: { alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  rule: { width: 72, height: 2, backgroundColor: colors.lime, marginVertical: 8 },
});
