import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { AppText } from '@/components/ui/AppText';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { AlertRow } from '@/components/safety/AlertRow';
import { RiskScore } from '@/components/safety/RiskScore';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { getAlerts, getRiskSnapshot } from '@/services/api/safety';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import type { SafetyAlert } from '@/types/models';

export default function SafetyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const enabled = Boolean(user) && (!isDemo || demoHydrated);
  const scoreQuery = useQuery({
    queryKey: ['safety', 'score', isDemo],
    queryFn: getRiskSnapshot,
    enabled,
    refetchInterval: isDemo ? false : 30_000,
  });
  const alertsQuery = useQuery({
    queryKey: ['safety', 'alerts', isDemo],
    queryFn: getAlerts,
    enabled,
    refetchInterval: isDemo ? false : 20_000,
  });
  const speechOn = usePreferencesStore((state) => Boolean(state.privacy.speechMonitoring));
  const alerts = (alertsQuery.data ?? []).filter((alert) => speechOn || alert.kind !== 'abusive_language');

  const metrics = scoreQuery.data;

  return (
    <View style={styles.screen}>
      <FlashList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <DemoBanner />
            <AppText variant="label" tone="lime">
              SAFETY CENTER
            </AppText>
            <AppText variant="display" style={styles.title}>
              Today’s risk picture
            </AppText>
            {scoreQuery.isLoading ? <LoadingState label="Scoring the latest signals" /> : null}
            {scoreQuery.isError ? (
              <ErrorState message={getErrorMessage(scoreQuery.error)} onRetry={() => void scoreQuery.refetch()} />
            ) : null}
            {metrics ? (
              <>
                <RiskScore score={metrics.score} simulated={metrics.simulated} />
                <View style={styles.grid}>
                  <Metric name="Fatigue" value={metrics.fatigue} />
                  <Metric name="Distraction" value={metrics.distraction} />
                <Metric name="Speeding" value={metrics.speeding} />
                <Metric name="SOS" value={metrics.sosCount} suffix="" />
                <Metric name="Speech" value={alerts.filter((alert) => alert.kind === 'abusive_language').length} suffix="" />
                <Metric name="Braking" value={alerts.filter((alert) => alert.kind === 'harsh_braking').length} suffix="" />
                </View>
                <AppText variant="caption" tone="dim">
                  {metrics.simulated
                    ? 'Fatigue, distraction, speeding, harsh braking, seat count, and abusive language on this screen come from the sample journey. Speech events do not keep the words.'
                    : 'Scores refresh from the safety service. Abusive-language events arrive only after passenger consent on the vehicle.'}
                </AppText>
              </>
            ) : null}
            <AppText variant="title">Alerts</AppText>
            {alertsQuery.isLoading ? <LoadingState label="Gathering alerts" /> : null}
            {alertsQuery.isError ? (
              <ErrorState message={getErrorMessage(alertsQuery.error)} onRetry={() => void alertsQuery.refetch()} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          alertsQuery.isLoading || alertsQuery.isError ? null : (
            <AppText tone="muted">No open alerts. A calm list is the goal.</AppText>
          )
        }
        renderItem={({ item }: { item: SafetyAlert }) => (
          <AlertRow
            alert={item}
            onPress={item.incidentId ? () => router.push(`/incident/${item.incidentId}`) : undefined}
          />
        )}
      />
    </View>
  );
}

function Metric({ name, value, suffix = '%' }: { name: string; value: number; suffix?: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="caption" tone="dim">
        {name}
      </AppText>
      <AppText variant="title">
        {Math.round(value)}
        {suffix}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { gap: 14, paddingBottom: 16 },
  title: { fontSize: 34, lineHeight: 38 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  gap: { height: 12 },
});
