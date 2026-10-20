import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { TripHistoryCard } from '@/components/trip/TripHistoryCard';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { getTripHistory } from '@/services/api/trips';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import type { Trip } from '@/types/models';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const [loadingMore, setLoadingMore] = useState(false);
  const historyQuery = useInfiniteQuery({
    queryKey: ['trips', 'history', isDemo],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getTripHistory(pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
  });
  const trips = historyQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={styles.screen}>
      <FlashList
        data={trips}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <DemoBanner />
            <AppText variant="label" tone="lime">
              TRIP HISTORY
            </AppText>
            <AppText variant="display" style={styles.title}>
              Routes you can revisit
            </AppText>
            <AppText tone="muted">Open a completed trip to replay the route that was shared.</AppText>
            {historyQuery.isLoading ? <LoadingState label="Loading past trips" /> : null}
            {historyQuery.isError ? (
              <ErrorState message={getErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          historyQuery.isLoading || historyQuery.isError ? null : (
            <EmptyState title="No completed trips" message="Finished journeys will collect here, with a replay of the shared route." />
          )
        }
        renderItem={({ item }: { item: Trip }) => (
          <TripHistoryCard trip={item} onPress={() => router.push(`/replay/${item.id}`)} />
        )}
        ListFooterComponent={
          historyQuery.hasNextPage ? (
            <Button
              label="Load more"
              variant="secondary"
              loading={loadingMore}
              onPress={() => {
                setLoadingMore(true);
                void historyQuery.fetchNextPage().finally(() => setLoadingMore(false));
              }}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { gap: 10, paddingBottom: 16 },
  title: { fontSize: 34, lineHeight: 38 },
});
