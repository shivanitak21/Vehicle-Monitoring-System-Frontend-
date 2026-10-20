import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, radius } from '@/constants/theme';
import { formatClock, formatDuration } from '@/lib/format';
import type { Trip } from '@/types/models';

function TripHistoryCardComponent({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <AppText variant="label" tone="muted">
          {formatClock(trip.startedAt).toUpperCase()}
        </AppText>
        <StatusPill label={trip.status === 'arrived' ? 'Arrived' : trip.status} tone={trip.status === 'arrived' ? 'info' : 'watch'} />
      </View>
      <AppText variant="title" style={styles.title}>
        {trip.passengerName}
      </AppText>
      <AppText tone="muted">
        {trip.origin} → {trip.destination}
      </AppText>
      <AppText variant="caption" tone="dim">
        {formatDuration(trip.startedAt, trip.endedAt)}
        {trip.simulated ? ' · Sample trip' : ''}
      </AppText>
    </Pressable>
  );
}

export const TripHistoryCard = memo(TripHistoryCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  pressed: { opacity: 0.88 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18 },
});
