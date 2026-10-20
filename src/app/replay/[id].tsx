import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { LiveMap } from '@/components/map/LiveMap';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { RouteProgress } from '@/components/trip/RouteProgress';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { pointAlong } from '@/lib/geo';
import { getTrip } from '@/services/api/trips';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';

export default function ReplayScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const tripQuery = useQuery({
    queryKey: ['trips', id, isDemo],
    queryFn: () => getTrip(id ?? ''),
    enabled: Boolean(id) && (!isDemo || demoHydrated),
  });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 4>(1);
  const [progress, setProgress] = useState(0);
  const seekWidth = useRef(1);

  useEffect(() => {
    if (!playing || !tripQuery.data) return;
    const timer = setInterval(() => {
      setProgress((current) => (current >= 1 ? 0 : Math.min(1, current + 0.008 * speed)));
    }, 100);
    return () => clearInterval(timer);
  }, [playing, speed, tripQuery.data]);

  const trip = tripQuery.data;
  const frame = trip ? pointAlong(trip.route, progress) : null;

  return (
    <Screen withHeader>
      <DemoBanner />
      {tripQuery.isLoading ? <LoadingState label="Preparing the replay" /> : null}
      {tripQuery.isError ? <ErrorState message={getErrorMessage(tripQuery.error)} onRetry={() => void tripQuery.refetch()} /> : null}
      {trip && frame ? (
        <>
          <AppText variant="title">{trip.passengerName}</AppText>
          <AppText tone="muted">
            {trip.origin} → {trip.destination}
          </AppText>
          {trip.simulated ? <AppText variant="caption" tone="lime">Sample replay. Not a live vehicle.</AppText> : null}
          <View style={styles.map}>
            <LiveMap route={trip.consent === 'granted' ? trip.route : []} coordinate={trip.consent === 'granted' ? frame.point : undefined} heading={frame.heading} interactive={false} />
          </View>
          {trip.consent !== 'granted' ? <AppText tone="muted">Replay is hidden because this trip was not shared.</AppText> : null}
          <RouteProgress progress={progress} />
          <View style={styles.controls}>
            <Pressable style={styles.button} onPress={() => setPlaying((value) => !value)}>
              <AppText tone="lime">{playing ? 'Pause' : 'Play'}</AppText>
            </Pressable>
            <Pressable style={styles.button} onPress={() => setSpeed((value) => (value === 1 ? 4 : 1))}>
              <AppText>{speed}×</AppText>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => {
                setProgress(0);
                setPlaying(true);
              }}
            >
              <AppText>Restart</AppText>
            </Pressable>
          </View>
          <Pressable
            style={styles.seek}
            onLayout={(event) => {
              seekWidth.current = event.nativeEvent.layout.width;
            }}
            onPress={(event) => {
              const width = seekWidth.current || 1;
              setProgress(Math.min(1, Math.max(0, event.nativeEvent.locationX / width)));
            }}
          >
            <View style={[styles.seekFill, { width: `${Math.round(progress * 100)}%` }]} />
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { height: 280, borderRadius: 24, overflow: 'hidden' },
  controls: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seek: {
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  seekFill: { height: 6, backgroundColor: colors.lime, borderRadius: radius.pill },
});
