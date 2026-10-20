import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';

export function RouteProgress({ progress }: { progress: number }) {
  const width = `${Math.max(4, Math.min(100, Math.round(progress * 100)))}%` as const;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.lime, borderRadius: radius.pill },
});
