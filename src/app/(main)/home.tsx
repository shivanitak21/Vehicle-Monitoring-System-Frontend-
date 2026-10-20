import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConnectionPill } from '@/components/ui/StatusPill';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatusPill } from '@/components/ui/StatusPill';
import { LiveMap } from '@/components/map/LiveMap';
import { CabinCameras } from '@/components/cabin/CabinCameras';
import { RouteProgress } from '@/components/trip/RouteProgress';
import { colors, radius } from '@/constants/theme';
import { formatEta, formatRelative, formatSpeed, greetingForNow, firstName } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { safetyKindLabel } from '@/lib/safety-labels';
import { canShowLocation, presentTrip } from '@/lib/present-trip';
import { getActiveTrip } from '@/services/api/trips';
import { sendSos } from '@/services/api/safety';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const enterDemo = useAuthStore((state) => state.enterDemo);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const fix = useLiveStore((state) => state.fix);
  const liveStatus = useLiveStore((state) => state.status);
  const cabin = useLiveStore((state) => state.cabin);
  const notice = useLiveStore((state) => state.guardianNotice);
  const liveEvents = useLiveStore((state) => state.events);
  const demoAlerts = useDemoStore((state) => state.alerts);
  const speechOn = usePreferencesStore((state) => Boolean(state.privacy.speechMonitoring));
  const connection = useLiveStore((state) => state.connection);
  const sharing = usePreferencesStore((state) => state.privacy.foregroundSharing);
  const tripQuery = useQuery({
    queryKey: ['trips', 'active', isDemo],
    queryFn: getActiveTrip,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
    refetchInterval: isDemo ? false : 20_000,
  });

  const waitingForDemo = isDemo && !demoHydrated;
  const trip = tripQuery.data ? presentTrip(tripQuery.data, fix, liveStatus) : null;
  const visible = trip ? canShowLocation(trip) : false;

  const confirmSos = () => {
    if (!trip) return;
    Alert.alert(
      isDemo ? 'Send a simulated SOS?' : 'Send SOS to emergency contacts?',
      isDemo
        ? 'This creates a sample incident only. No one is called or notified.'
        : 'This alerts the emergency contacts on the active trip. Send it only if you mean to.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isDemo ? 'Create sample SOS' : 'Send SOS',
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
        showsUserLocation={sharing}
      />
      <LinearGradient colors={['rgba(7,11,18,0.92)', 'rgba(7,11,18,0)']} style={[styles.topFade, { height: insets.top + 120 }]} />
      <View style={[styles.header, { top: insets.top + 8 }]}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="muted">
            {greetingForNow()}
          </AppText>
          <AppText variant="title">{user ? firstName(user.name) : 'Velora'}</AppText>
        </View>
        <ConnectionPill state={isDemo ? 'demo' : connection} />
        <DemoBanner />
      </View>
      <View style={[styles.sheet, { bottom: 12, maxHeight: '62%' }]}>
        <ScrollView
          nestedScrollEnabled
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}
        >
        {waitingForDemo || tripQuery.isLoading ? <LoadingState label="Looking for an active journey" /> : null}
        {!waitingForDemo && tripQuery.isError ? (
          <ErrorState
            message={getErrorMessage(tripQuery.error)}
            onRetry={() => void tripQuery.refetch()}
          />
        ) : null}
        {!waitingForDemo && tripQuery.isError && !isDemo ? (
          <Button
            label="Open demo mode instead"
            variant="ghost"
            onPress={() => {
              void enterDemo();
            }}
          />
        ) : null}
        {!waitingForDemo && !tripQuery.isLoading && !tripQuery.isError && !trip ? (
          <View style={styles.empty}>
            <AppText variant="title">No live journey</AppText>
            <AppText tone="muted">When a passenger shares a trip, the map, ETA, and route will appear here.</AppText>
          </View>
        ) : null}
        {trip && !visible ? (
          <View style={styles.empty}>
            <AppText variant="title">{trip.passengerName} is not sharing</AppText>
            <AppText tone="muted">
              Location stays hidden until {trip.passengerName} approves sharing. Velora does not estimate a hidden route.
            </AppText>
          </View>
        ) : null}
        {trip && visible ? (
          <View style={styles.trip}>
            {notice ? (
              <Pressable onPress={() => router.push('/cabin')}>
                <AppText variant="caption" tone="danger">
                  Guardian page · {notice.reason}
                </AppText>
              </Pressable>
            ) : null}
            {cabin && cabin.tripId === trip.id ? (
              <CabinCameras cabin={cabin} onPress={() => router.push('/cabin')} />
            ) : null}
            {(() => {
              const latest = (isDemo ? demoAlerts : liveEvents).find(
                (alert) => alert.tripId === trip.id && (speechOn || alert.kind !== 'abusive_language'),
              );
              if (!latest) return null;
              return (
                <Pressable onPress={() => router.push('/cabin')}>
                  <AppText variant="caption" tone={latest.severity === 'info' ? 'muted' : 'amber'}>
                    {safetyKindLabel[latest.kind]} · {latest.title}
                  </AppText>
                </Pressable>
              );
            })()}
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
            <RouteProgress progress={trip.progress} />
            <View style={styles.metrics}>
              <Metric label="ETA" value={formatEta(trip.etaMinutes)} />
              <Metric label="Speed" value={formatSpeed(trip.speedKph)} />
              <Metric label={trip.simulated ? 'Simulated' : 'Updated'} value={formatRelative(trip.updatedAt)} />
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={() => router.push(`/trip/${trip.id}`)}>
                <AppText tone="lime">Trip details</AppText>
              </Pressable>
              <Pressable style={styles.action} onPress={() => router.push('/safety')}>
                <AppText tone="lime">Safety</AppText>
              </Pressable>
              <Pressable style={styles.action} onPress={confirmSos}>
                <AppText tone="danger">SOS</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
        </ScrollView>
      </View>
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
  topFade: { position: 'absolute', left: 0, right: 0, top: 0 },
  header: { position: 'absolute', left: 20, right: 20, gap: 10 },
  headerCopy: { gap: 2 },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(13, 20, 32, 0.94)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sheetBody: { gap: 12 },
  trip: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { gap: 8 },
});
