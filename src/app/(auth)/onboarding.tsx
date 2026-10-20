import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

const slides = [
  {
    kicker: '01',
    title: 'A journey they chose to share',
    body: 'Follow a live map, ETA, and route only after a passenger approves location sharing with their guardians.',
  },
  {
    kicker: '02',
    title: 'Safety signals in one place',
    body: 'Fatigue, distraction, speeding, and SOS sit beside the trip, each one labeled with when it happened.',
  },
  {
    kicker: '03',
    title: 'Consent stays reversible',
    body: 'Camera evidence and background location wait until someone turns them on. Demo mode never pretends to be live.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const complete = useAuthStore((state) => state.completeOnboarding);
  const [page, setPage] = useState(0);
  const slide = slides[page] ?? slides[0]!;

  const finish = async (path: '/login' | '/register') => {
    await complete();
    router.replace(path);
  };

  const next = () => {
    if (page === slides.length - 1) {
      void finish('/login');
      return;
    }
    setPage(page + 1);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.top}>
        <AppText variant="label" tone="lime">
          VELORA
        </AppText>
        <Pressable onPress={() => void finish('/login')}>
          <AppText tone="muted">Skip</AppText>
        </Pressable>
      </View>
      <Animated.View key={slide.kicker} entering={FadeInRight.duration(360)} style={styles.slide}>
        <AppText variant="display" tone="lime">
          {slide.kicker}
        </AppText>
        <AppText variant="display" style={styles.title}>
          {slide.title}
        </AppText>
        <AppText tone="muted" style={styles.body}>
          {slide.body}
        </AppText>
      </Animated.View>
      <View style={styles.dots}>
        {slides.map((slide, index) => (
          <View key={slide.kicker} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.actions}>
        <Button label={page === slides.length - 1 ? 'Continue to sign in' : 'Next'} onPress={next} />
        <Button label="Create an account" variant="ghost" onPress={() => void finish('/register')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slide: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 36, lineHeight: 40 },
  body: { fontSize: 17, lineHeight: 26 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.surface2 },
  dotActive: { width: 22, backgroundColor: colors.lime },
  actions: { paddingHorizontal: 24, gap: 10, marginTop: 18 },
});
