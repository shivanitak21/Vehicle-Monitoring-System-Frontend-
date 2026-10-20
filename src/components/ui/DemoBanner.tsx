import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';

export function DemoBanner() {
  const isDemo = useAuthStore((state) => state.isDemo);
  if (!isDemo) return null;
  return (
    <View style={styles.banner}>
      <AppText variant="caption" tone="lime">
        DEMO · Simulated journey. Not live tracking.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(214, 255, 74, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
});
