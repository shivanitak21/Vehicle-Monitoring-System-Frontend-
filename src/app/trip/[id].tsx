import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LiveMap } from '@/components/map/LiveMap';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { CabinCameras } from '@/components/cabin/CabinCameras';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatusPill } from '@/components/ui/StatusPill';
import { RouteProgress } from '@/components/trip/RouteProgress';
import { getErrorMessage } from '@/lib/errors';
import { formatClock, formatEta, formatRelative, formatSpeed } from '@/lib/format';
import { locationProvenance, routeRecordLabel } from '@/lib/provenance';
import { canShowLocation, presentTrip } from '@/lib/present-trip';
import { getTrip } from '@/services/api/trips';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';

export default function TripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const fixes = useLiveStore((state) => state.fixes);
  const latestFix = useLiveStore((state) => state.fix);
  const connection = useLiveStore((state) => state.connection);
  const liveStatus = useLiveStore((state) => state.status);
  const cabin = useLiveStore((state) => state.cabin);
  const tripQuery = useQuery({
    queryKey: ['trips', id, isDemo],
    queryFn: () => getTrip(id ?? ''),
    enabled: Boolean(id) && (!isDemo || demoHydrated),
  });
  const matchedFix = tripQuery.data
    ? (fixes[tripQuery.data.id] ?? (latestFix?.tripId === tripQuery.data.id ? latestFix : null))
    : null;
  const trip = tripQuery.data
    ? presentTrip(tripQuery.data, matchedFix, liveStatus?.tripId === tripQuery.data.id ? liveStatus : null)
    : null;
  const visible = trip ? canShowLocation(trip) : false;

  return (
    <Screen withHeader>
      <ScreenHeader title="Trip" />
      {tripQuery.isLoading ? <LoadingState label="Opening the trip" /> : null}
      {tripQuery.isError ? <ErrorState message={getErrorMessage(tripQuery.error)} onRetry={() => void tripQuery.refetch()} /> : null}
      {trip ? (
        <>
          <View style={styles.map}>
            <LiveMap
              route={visible ? trip.route : []}
              coordinate={visible ? trip.current : undefined}
              heading={trip.heading}
              interactive={false}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText variant="caption" tone="muted">
                {trip.relationship.toUpperCase()}
              </AppText>
              <AppText variant="title">{trip.passengerName}</AppText>
            </View>
            <StatusPill label={visible ? 'Location shared' : 'Location hidden'} tone={visible ? 'lime' : 'watch'} />
          </View>
          <AppText tone="muted">
            {trip.origin} → {trip.destination}
          </AppText>
          <View style={styles.row}>
            <ProvenanceChip
              provenance={locationProvenance({
                simulated: trip.simulated,
                source: matchedFix?.source,
                updatedAt: trip.updatedAt,
                connection: isDemo ? 'demo' : connection,
                sharing: visible,
              })}
            />
            <AppText variant="caption" tone="dim">
              {routeRecordLabel({ simulated: trip.simulated, pointCount: visible ? trip.route.length : 0 })}
            </AppText>
          </View>
          <RouteProgress progress={trip.progress} />
          {visible ? (
            <View style={styles.metrics}>
              <Stat label="Speed" value={formatSpeed(trip.speedKph)} />
              <Stat label="ETA" value={formatEta(trip.etaMinutes)} />
              <Stat label="Updated" value={formatRelative(trip.updatedAt)} />
            </View>
          ) : (
            <AppText tone="muted">Precise coordinates stay hidden because sharing is not approved.</AppText>
          )}
          {visible && cabin && cabin.tripId === trip.id ? (
            <CabinCameras cabin={cabin} onPress={() => router.push('/cabin')} />
          ) : null}
          <Card>
            <AppText variant="label" tone="muted">
              DRIVER
            </AppText>
            <AppText variant="title" style={styles.driver}>
              {trip.driver.name}
            </AppText>
            <AppText tone="muted">
              {trip.driver.vehicle} · {trip.driver.plate}
            </AppText>
            <AppText variant="caption" tone="dim">
              Rating {trip.driver.rating.toFixed(1)} · Started {formatClock(trip.startedAt)}
            </AppText>
          </Card>
          {visible ? (
            <AppText variant="caption" tone="dim">
              {trip.current.latitude.toFixed(5)}, {trip.current.longitude.toFixed(5)}
              {trip.simulated ? ' · Sample coordinate' : ''}
            </AppText>
          ) : null}
          <Button label="Replay this route" variant="secondary" onPress={() => router.push(`/replay/${trip.id}`)} />
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="caption" tone="dim">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 240, borderRadius: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  flex: { flex: 1 },
  metrics: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 4 },
  driver: { fontSize: 20 },
});
