import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConnectionPill } from '@/components/ui/StatusPill';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { ProvenanceChip } from '@/components/ui/ProvenanceChip';
import { StatusPill } from '@/components/ui/StatusPill';
import { LiveMap } from '@/components/map/LiveMap';
import { colors, radius, space } from '@/constants/theme';
import { formatEta, formatRelative, formatSpeed, greetingForNow, firstName } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { mergeAlerts } from '@/lib/activity-filters';
import { locationProvenance, safetyPosture } from '@/lib/provenance';
import { safetyKindLabel } from '@/lib/safety-labels';
import { canShowLocation, presentTrip } from '@/lib/present-trip';
import { getActiveTrips } from '@/services/api/trips';
import { getAlerts, sendSos } from '@/services/api/safety';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import type { SafetyAlert, Trip } from '@/types/models';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const enterDemo = useAuthStore((state) => state.enterDemo);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const fixes = useLiveStore((state) => state.fixes);
  const latestFix = useLiveStore((state) => state.fix);
  const liveStatus = useLiveStore((state) => state.status);
  const notice = useLiveStore((state) => state.guardianNotice);
  const liveEvents = useLiveStore((state) => state.events);
  const connection = useLiveStore((state) => state.connection);
  const speechOn = usePreferencesStore((state) => Boolean(state.privacy.speechMonitoring));
  const sharing = usePreferencesStore((state) => state.privacy.foregroundSharing);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const tripQuery = useQuery({
    queryKey: ['trips', 'active', isDemo],
    queryFn: getActiveTrips,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
    refetchInterval: isDemo ? false : 20_000,
  });
  const alertsQuery = useQuery({
    queryKey: ['safety', 'alerts', isDemo],
    queryFn: getAlerts,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
    refetchInterval: isDemo ? false : 20_000,
  });

  const waitingForDemo = isDemo && !demoHydrated;
  const trips = (tripQuery.data ?? []).map((trip) => {
    const fix = fixes[trip.id] ?? (latestFix?.tripId === trip.id ? latestFix : null);
    return presentTrip(trip, fix, liveStatus?.tripId === trip.id ? liveStatus : null);
  });
  const trip = trips.find((item) => item.id === selectedId) ?? trips[0] ?? null;
  const visible = trip ? canShowLocation(trip) : false;
  const tripAlerts = mergeAlerts(alertsQuery.data ?? [], liveEvents).filter(
    (alert) => alert.tripId === trip?.id && (speechOn || alert.kind !== 'abusive_language'),
  );
  const posture = safetyPosture(tripAlerts);
  const latest = tripAlerts[0];
  const provenance = trip
    ? locationProvenance({
        simulated: trip.simulated,
        source: (fixes[trip.id] ?? latestFix)?.tripId === trip.id ? (fixes[trip.id] ?? latestFix)?.source : null,
        updatedAt: trip.updatedAt,
        connection: isDemo ? 'demo' : connection,
        sharing: visible,
      })
    : 'unknown';

  const confirmSos = () => {
    if (!trip) return;
    Alert.alert(
      isDemo ? 'Create a simulated SOS?' : 'Notify emergency contacts?',
      isDemo
        ? 'This creates a sample incident on this phone. Nobody is called, and emergency services are not contacted.'
        : 'This asks the safety service to notify the emergency contacts for this trip. It does not contact emergency services by itself.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDemo ? 'Create sample SOS' : 'Notify contacts',
          style: 'destructive',
          onPress: () => {
            void sendSos(trip.id)
              .then((incident) => {
                void queryClient.invalidateQueries({ queryKey: ['safety'] });
                void queryClient.invalidateQueries({ queryKey: ['incidents'] });
                router.push(`/incident/${incident.id}`);
              })
              .catch((error) => Alert.alert('SOS was not sent', getErrorMessage(error)));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <LiveMap
        route={visible && trip ? trip.route : []}
        coordinate={visible && trip ? trip.current : undefined}
        heading={trip?.heading ?? 0}
        showsUserLocation={sharing && !isDemo}
      />
      <View style={[styles.header, { top: insets.top + space.sm }]}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="muted">
            {greetingForNow()}
          </AppText>
          <AppText variant="title">{user ? firstName(user.name) : 'Velora'}</AppText>
        </View>
        <View style={styles.headerSide}>
          {isDemo ? <DemoBanner /> : <ConnectionPill state={connection} />}
          <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} hitSlop={8}>
            <AppText variant="label" tone="lime">
              Profile
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={[styles.sheet, { bottom: space.md, maxHeight: '58%' }]}>
        <ScrollView
          nestedScrollEnabled
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}
        >
          {waitingForDemo || tripQuery.isLoading ? <LoadingState label="Looking for active trips" /> : null}
          {!waitingForDemo && tripQuery.isError ? (
            <ErrorState message={getErrorMessage(tripQuery.error)} onRetry={() => void tripQuery.refetch()} />
          ) : null}
          {!waitingForDemo && tripQuery.isError && !isDemo ? (
            <Button label="Open demo mode instead" variant="ghost" onPress={() => void enterDemo()} />
          ) : null}
          {!waitingForDemo && !tripQuery.isLoading && !tripQuery.isError && trips.length === 0 ? (
            <View style={styles.empty}>
              <AppText variant="title">No active trip</AppText>
              <AppText tone="muted">When a passenger shares a trip, the map and status appear here. An empty map is not a verified safe state.</AppText>
            </View>
          ) : null}
          {trips.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.passengers}>
              {trips.map((item) => (
                <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[styles.passenger, item.id === trip?.id && styles.passengerOn]}>
                  <AppText variant="label" tone={item.id === trip?.id ? 'lime' : 'muted'}>
                    {item.passengerName}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          {trip && !visible ? (
            <View style={styles.empty}>
              <AppText variant="title">{trip.passengerName} is not sharing</AppText>
              <AppText tone="muted">
                Location stays hidden until {trip.passengerName} approves sharing. Velora does not estimate a hidden route.
              </AppText>
              <ProvenanceChip provenance="unknown" />
            </View>
          ) : null}
          {trip && visible ? <TripCard trip={trip} provenance={provenance} posture={posture.label} postureTone={posture.tone} latest={latest} notice={notice?.reason} onTrip={() => router.push(`/trip/${trip.id}`)} onActivity={() => router.push('/safety')} onSos={confirmSos} onNotice={() => router.push(latest?.incidentId ? `/incident/${latest.incidentId}` : '/safety')} /> : null}
        </ScrollView>
      </View>
    </View>
  );
}

function TripCard({
  trip,
  provenance,
  posture,
  postureTone,
  latest,
  notice,
  onTrip,
  onActivity,
  onSos,
  onNotice,
}: {
  trip: Trip;
  provenance: ReturnType<typeof locationProvenance>;
  posture: string;
  postureTone: 'critical' | 'watch' | 'info' | 'unknown';
  latest?: SafetyAlert;
  notice?: string;
  onTrip: () => void;
  onActivity: () => void;
  onSos: () => void;
  onNotice: () => void;
}) {
  return (
    <View style={styles.trip}>
      {notice ? (
        <Pressable onPress={onNotice}>
          <AppText variant="caption" tone="danger">
            Urgent · {notice}
          </AppText>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <View style={styles.flex}>
          <AppText variant="caption" tone="muted">
            {trip.relationship.toUpperCase()}
          </AppText>
          <AppText variant="title">{trip.passengerName}</AppText>
        </View>
        <StatusPill label={trip.status === 'en_route' ? 'En route' : trip.status} tone="lime" />
      </View>
      <AppText tone="muted">
        {trip.origin} → {trip.destination}
      </AppText>
      <AppText variant="caption" tone="dim">
        {trip.driver.name} · {trip.driver.vehicle} · {trip.driver.plate}
      </AppText>
      <View style={styles.metrics}>
        <Metric label="ETA" value={formatEta(trip.etaMinutes)} />
        <Metric label="Speed" value={formatSpeed(trip.speedKph)} />
        <Metric label="GPS" value={formatRelative(trip.updatedAt)} />
      </View>
      <View style={styles.row}>
        <ProvenanceChip provenance={provenance} />
        {postureTone === 'critical' || postureTone === 'watch' ? (
          <StatusPill label={posture} tone={postureTone} />
        ) : (
          <AppText variant="caption" tone="dim">
            {posture}
          </AppText>
        )}
      </View>
      {latest ? (
        <Pressable onPress={onActivity}>
          <AppText tone="muted">
            {safetyKindLabel[latest.kind]} · {latest.title}
          </AppText>
        </Pressable>
      ) : (
        <AppText variant="caption" tone="dim">
          No events on this trip. Status stays unverified until the vehicle reports one.
        </AppText>
      )}
      <Button label="View trip" onPress={onTrip} />
      <Button label="Emergency SOS" variant="danger" onPress={onSos} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" tone="dim">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerSide: { alignItems: 'flex-end', gap: space.sm },
  sheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  sheetBody: { gap: space.md },
  trip: { gap: space.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
  metrics: { flexDirection: 'row', gap: space.sm },
  metric: { flex: 1, gap: 2 },
  empty: { gap: space.sm },
  passengers: { gap: space.sm },
  passenger: {
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerOn: { backgroundColor: colors.surface2 },
});
