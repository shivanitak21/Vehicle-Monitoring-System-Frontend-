import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { DemoBanner } from '@/components/ui/DemoBanner';

export function ScreenHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      <DemoBanner />
      <AppText variant="display" style={styles.title}>
        {title}
      </AppText>
      {detail ? <AppText tone="muted">{detail}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: { fontSize: 32, lineHeight: 36 },
});
