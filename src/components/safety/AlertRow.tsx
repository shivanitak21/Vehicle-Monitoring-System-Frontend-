import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, radius } from '@/constants/theme';
import { formatRelative } from '@/lib/format';
import { safetyKindLabel } from '@/lib/safety-labels';
import type { SafetyAlert } from '@/types/models';

function AlertRowComponent({ alert, onPress }: { alert: SafetyAlert; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}>
      <View style={styles.top}>
        <AppText variant="label" tone="muted">
          {safetyKindLabel[alert.kind].toUpperCase()}
        </AppText>
        <StatusPill label={alert.severity} tone={alert.severity} />
      </View>
      <AppText variant="title" style={styles.title}>
        {alert.title}
      </AppText>
      <AppText tone="muted">{alert.message}</AppText>
      <AppText variant="caption" tone="dim">
        {formatRelative(alert.createdAt)}
        {alert.simulated ? ' · Simulated' : ''}
      </AppText>
    </Pressable>
  );
}

export const AlertRow = memo(AlertRowComponent);

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  pressed: { opacity: 0.86 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18 },
});
