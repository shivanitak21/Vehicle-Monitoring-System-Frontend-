import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';
import type { CabinMonitor, CabinSeat } from '@/types/models';

export function CabinCameras({
  cabin,
  onPress,
}: {
  cabin: CabinMonitor;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.wrap}>
      <View style={styles.pair}>
        <DriverFrame cabin={cabin} />
        <CabinFrame cabin={cabin} />
      </View>
      <AppText variant="caption" tone="dim">
        {cabin.simulated
          ? 'Sample cabin. The face model and seat count are simulated, not a live camera.'
          : 'Seat positions shared for this trip.'}
      </AppText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

function DriverFrame({ cabin }: { cabin: CabinMonitor }) {
  const scan = useSharedValue(0);
  useEffect(() => {
    scan.value = withRepeat(withTiming(1, { duration: 2200 }), -1, false);
  }, [scan]);
  const line = useAnimatedStyle(() => ({ top: 12 + scan.value * 52 }));
  const glance = cabin.gaze === 'glance';

  return (
    <View style={styles.frame}>
      <View style={styles.frameHead}>
        <View style={styles.rec} />
        <AppText variant="caption" tone="lime">
          FACE
        </AppText>
      </View>
      <View style={styles.stage}>
        <Animated.View style={[styles.scan, line]} />
        <View style={styles.shoulders} />
        <View style={styles.head}>
          <View style={[styles.eyes, glance ? styles.eyesGlance : null]}>
            <View style={[styles.eye, cabin.gaze === 'drowsy' ? styles.eyeDim : null]} />
            <View style={[styles.eye, cabin.gaze === 'drowsy' ? styles.eyeDim : null]} />
          </View>
        </View>
      </View>
      <AppText variant="caption" numberOfLines={1}>
        {cabin.driverName.split(' ')[0]}
      </AppText>
      <AppText variant="caption" tone={glance ? 'amber' : 'muted'} numberOfLines={1}>
        {cabin.gazeLabel}
      </AppText>
    </View>
  );
}

function CabinFrame({ cabin }: { cabin: CabinMonitor }) {
  const front = cabin.seats.slice(0, 2);
  const rear = cabin.seats.slice(2, 4);
  return (
    <View style={styles.frame}>
      <View style={styles.frameHead}>
        <View style={styles.rec} />
        <AppText variant="caption" tone="lime">
          CABIN
        </AppText>
      </View>
      <View style={styles.stage}>
        <View style={styles.glass} />
        <View style={styles.seatRow}>
          {front.map((seat) => (
            <Seat key={seat.id} seat={seat} />
          ))}
        </View>
        <View style={styles.seatRow}>
          {rear.map((seat) => (
            <Seat key={seat.id} seat={seat} />
          ))}
        </View>
      </View>
      <AppText variant="caption" numberOfLines={1}>
        {cabin.seatCount} seated
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {cabin.passengerName.split(' ')[0]} · rear left
      </AppText>
    </View>
  );
}

function Seat({ seat }: { seat: CabinSeat }) {
  const filled = Boolean(seat.occupant);
  const initial = seat.occupant ? seat.occupant.slice(0, 1) : '';
  return (
    <View style={[styles.seat, filled ? styles.seatFilled : null, seat.role === 'passenger' ? styles.seatPassenger : null]}>
      {filled ? (
        <AppText variant="caption" tone={seat.role === 'passenger' ? 'lime' : 'default'}>
          {initial}
        </AppText>
      ) : (
        <View style={styles.seatEmpty} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  pair: { flexDirection: 'row', gap: 8 },
  frame: {
    flex: 1,
    minHeight: 148,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    gap: 4,
  },
  frameHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rec: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral },
  stage: {
    height: 78,
    borderRadius: 12,
    backgroundColor: '#101826',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    gap: 4,
  },
  scan: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(214, 255, 74, 0.55)',
  },
  shoulders: {
    position: 'absolute',
    bottom: 0,
    width: 54,
    height: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#243044',
  },
  head: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C9B29A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eyes: { flexDirection: 'row', gap: 6, marginTop: 2 },
  eyesGlance: { transform: [{ translateX: 4 }] },
  eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.black },
  eyeDim: { opacity: 0.35, height: 2 },
  glass: { position: 'absolute', top: 6, width: 46, height: 6, borderRadius: 4, backgroundColor: 'rgba(142, 180, 255, 0.35)' },
  seatRow: { flexDirection: 'row', gap: 6 },
  seat: {
    width: 28,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  seatFilled: { backgroundColor: colors.surface2, borderColor: 'rgba(255,255,255,0.16)' },
  seatPassenger: { borderColor: colors.lime, backgroundColor: 'rgba(214, 255, 74, 0.16)' },
  seatEmpty: { width: 8, height: 2, borderRadius: 1, backgroundColor: colors.textDim },
});
