import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { colors, radius, space } from '@/constants/theme';
import { formatRelative } from '@/lib/format';
import type { CabinMonitor, CabinSeat } from '@/types/models';

function reported(value: string | undefined, fallback: string): string {
  if (!value || value === 'unknown') return fallback;
  return value;
}

export function CabinCameras({ cabin, onPress }: { cabin: CabinMonitor; onPress?: () => void }) {
  const body = (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <AppText variant="label">Cabin status</AppText>
        <ProvenanceChip provenance={cabin.simulated ? 'demo' : 'real'} />
      </View>
      <AppText tone="muted">
        {cabin.simulated
          ? 'Demo cabin state. This phone is not showing a live camera.'
          : 'Status comes from the vehicle report. This phone does not open a live video stream.'}
      </AppText>
      <View style={styles.grid}>
        <Fact label="Camera" value={reported(cabin.camera, 'Unknown')} />
        <Fact label="Inference" value={reported(cabin.inference, 'Unknown')} />
        <Fact label="Recording" value={reported(cabin.recording, 'Unknown')} />
        <Fact label="Updated" value={formatRelative(cabin.updatedAt)} />
      </View>
      <AppText variant="caption" tone="dim">
        Face model: {cabin.gazeLabel}
        {typeof cabin.confidence === 'number' ? ` · confidence ${Math.round(cabin.confidence)}%` : ''}
      </AppText>
      <View style={styles.seats}>
        {cabin.seats.map((seat) => (
          <Seat key={seat.id} seat={seat} />
        ))}
      </View>
      <AppText variant="caption" tone="dim">
        {cabin.seatCount} occupied · {cabin.driverName} driving
        {cabin.deviceStatus ? ` · ${cabin.deviceStatus}` : ' · vehicle status not reported'}
      </AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="caption" tone="dim">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

function Seat({ seat }: { seat: CabinSeat }) {
  return (
    <View style={[styles.seat, seat.occupant ? styles.seatOn : null]}>
      <AppText variant="caption" tone={seat.occupant ? 'default' : 'dim'} numberOfLines={1}>
        {seat.label}
      </AppText>
      <AppText variant="caption" tone={seat.occupant ? 'lime' : 'dim'} numberOfLines={1}>
        {seat.occupant ?? 'Empty'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fact: { width: '47%', gap: 2 },
  seats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  seat: {
    width: '47%',
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    padding: space.sm,
    gap: 2,
  },
  seatOn: { backgroundColor: colors.surface2 },
});
