import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export function DemoBanner() {
  const isDemo = useAuthStore((state) => state.isDemo);
  if (!isDemo) return null;
  return (
    <View
      accessibilityLabel="Demo mode. Simulated data, not live tracking."
      style={styles.banner}
    >
      <AppText variant="caption" tone="lime">
        DEMO
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(214, 255, 74, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
});
