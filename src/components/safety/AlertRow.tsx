import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, radius, space } from '@/constants/theme';
import { formatClock } from '@/lib/format';
import { safetyKindLabel } from '@/lib/safety-labels';
import type { SafetyAlert } from '@/types/models';

function AlertRowComponent({
  alert,
  passengerName,
  vehicleLabel,
  onPress,
  onAcknowledge,
}: {
  alert: SafetyAlert;
  passengerName?: string;
  vehicleLabel?: string;
  onPress?: () => void;
  onAcknowledge?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
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
        {formatClock(alert.createdAt)}
        {passengerName ? ` · ${passengerName}` : ''}
        {vehicleLabel ? ` · ${vehicleLabel}` : ''}
      </AppText>
      <View style={styles.meta}>
        <ProvenanceChip provenance={alert.simulated ? 'demo' : 'real'} />
        <AppText variant="caption" tone="dim">
          {alert.source ?? (alert.simulated ? 'Demo simulator' : 'Safety service')}
          {' · '}
          {alert.acknowledged ? 'Seen' : 'Not acknowledged'}
        </AppText>
      </View>
      {onAcknowledge && !alert.acknowledged ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark this event as seen. This does not contact emergency services."
          onPress={onAcknowledge}
          style={styles.ack}
        >
          <AppText variant="label">Mark as seen</AppText>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const AlertRow = memo(AlertRowComponent);

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
  },
  pressed: { opacity: 0.86 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  title: { fontSize: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  ack: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
});
