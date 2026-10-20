import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { AlertRow } from '@/components/safety/AlertRow';
import { colors, radius, space } from '@/constants/theme';
import {
  defaultAlertFilters,
  describeAlert,
  filterActivity,
  mergeAlerts,
  uniqueLabels,
  type AlertFilters,
} from '@/lib/activity-filters';
import { getErrorMessage } from '@/lib/errors';
import { acknowledgeAlert, getAlerts } from '@/services/api/safety';
import { getActiveTrips, getTripHistory } from '@/services/api/trips';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import { usePreferencesStore } from '@/stores/preferences-store';

const dates = [
  { id: 'all', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 days' },
] as const;

const severities = [
  { id: 'all', label: 'Any severity' },
  { id: 'critical', label: 'Urgent' },
  { id: 'watch', label: 'Warning' },
  { id: 'info', label: 'Info' },
] as const;

export default function SafetyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const liveEvents = useLiveStore((state) => state.events);
  const speechOn = usePreferencesStore((state) => Boolean(state.privacy.speechMonitoring));
  const [filters, setFilters] = useState<AlertFilters>(defaultAlertFilters);
  const enabled = Boolean(user) && (!isDemo || demoHydrated);
  const alertsQuery = useQuery({
    queryKey: ['safety', 'alerts', isDemo],
    queryFn: getAlerts,
    enabled,
    refetchInterval: isDemo ? false : 20_000,
  });
  const tripsQuery = useQuery({
    queryKey: ['trips', 'lookup', isDemo],
    queryFn: async () => {
      const active = await getActiveTrips().catch(() => []);
      const history = await getTripHistory().catch(() => ({ items: [], nextCursor: null }));
      return [...active, ...history.items];
    },
    enabled,
  });
  const acknowledge = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['safety', 'alerts'] });
    },
    onError: (error) => Alert.alert('Could not mark this event', getErrorMessage(error)),
  });

  const lookups = (tripsQuery.data ?? []).map((trip) => ({
    id: trip.id,
    passengerName: trip.passengerName,
    vehicle: trip.driver.vehicle,
  }));
  const merged = mergeAlerts(alertsQuery.data ?? [], liveEvents).filter(
    (alert) => speechOn || alert.kind !== 'abusive_language',
  );
  const items = filterActivity(
    merged.map((alert) => describeAlert(alert, lookups)),
    filters,
  );
  const passengers = uniqueLabels(lookups.map((trip) => trip.passengerName));
  const vehicles = uniqueLabels(lookups.map((trip) => trip.vehicle));

  return (
    <View style={styles.screen}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.alert.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.xxl }}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title="Activity"
              detail="Events reported for shared trips. An empty list does not mean a trip is verified safe."
            />
            <FilterRow
              label="Passenger"
              value={filters.passenger}
              options={['all', ...passengers]}
              onChange={(passenger) => setFilters((current) => ({ ...current, passenger }))}
            />
            <FilterRow
              label="Vehicle"
              value={filters.vehicle}
              options={['all', ...vehicles]}
              onChange={(vehicle) => setFilters((current) => ({ ...current, vehicle }))}
            />
            <FilterRow
              label="Severity"
              value={filters.severity}
              options={severities.map((item) => item.id)}
              labels={Object.fromEntries(severities.map((item) => [item.id, item.label]))}
              onChange={(severity) => setFilters((current) => ({ ...current, severity: severity as AlertFilters['severity'] }))}
            />
            <FilterRow
              label="Date"
              value={filters.date}
              options={dates.map((item) => item.id)}
              labels={Object.fromEntries(dates.map((item) => [item.id, item.label]))}
              onChange={(date) => setFilters((current) => ({ ...current, date: date as AlertFilters['date'] }))}
            />
            {alertsQuery.isLoading ? <LoadingState label="Gathering events" /> : null}
            {alertsQuery.isError ? (
              <ErrorState message={getErrorMessage(alertsQuery.error)} onRetry={() => void alertsQuery.refetch()} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          alertsQuery.isLoading || alertsQuery.isError ? null : (
            <AppText tone="muted">No events match this view. That does not verify the trip as safe.</AppText>
          )
        }
        renderItem={({ item }) => (
          <AlertRow
            alert={item.alert}
            passengerName={item.passengerName}
            vehicleLabel={item.vehicleLabel}
            onPress={item.alert.incidentId ? () => router.push(`/incident/${item.alert.incidentId}`) : undefined}
            onAcknowledge={
              item.alert.acknowledged
                ? undefined
                : () => {
                    acknowledge.mutate(item.alert.id);
                  }
            }
          />
        )}
      />
    </View>
  );
}

function FilterRow({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.filter}>
      <AppText variant="caption" tone="dim">
        {label}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((option) => {
          const selected = option === value;
          const text = option === 'all' ? 'All' : (labels?.[option] ?? option);
          return (
            <Pressable key={option} onPress={() => onChange(option)} style={[styles.chip, selected && styles.chipOn]}>
              <AppText variant="caption" tone={selected ? 'lime' : 'muted'}>
                {text}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { gap: space.lg, paddingBottom: space.lg },
  gap: { height: space.md },
  filter: { gap: space.sm },
  chips: { gap: space.sm },
  chip: {
    minHeight: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.surface2 },
});
