import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { TripHistoryCard } from '@/components/trip/TripHistoryCard';
import { colors, space } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { routeRecordLabel } from '@/lib/provenance';
import { getActiveTrips, getTripHistory } from '@/services/api/trips';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import type { Trip } from '@/types/models';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const enabled = Boolean(user) && (!isDemo || demoHydrated);
  const [loadingMore, setLoadingMore] = useState(false);
  const activeQuery = useQuery({
    queryKey: ['trips', 'active', isDemo],
    queryFn: getActiveTrips,
    enabled,
  });
  const historyQuery = useInfiniteQuery({
    queryKey: ['trips', 'history', isDemo],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getTripHistory(pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled,
  });
  const active = activeQuery.data ?? [];
  const completed = (historyQuery.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (trip) => !active.some((item) => item.id === trip.id),
  );
  const trips = [...active, ...completed];

  return (
    <View style={styles.screen}>
      <FlashList
        data={trips}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.xxl }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeader
              title="Trips"
              detail="Active journeys stay at the top. A demo route is a simulation. A recorded route is GPS the service stored."
            />
            {activeQuery.isLoading || historyQuery.isLoading ? <LoadingState label="Loading trips" /> : null}
            {activeQuery.isError ? (
              <ErrorState message={getErrorMessage(activeQuery.error)} onRetry={() => void activeQuery.refetch()} />
            ) : null}
            {historyQuery.isError ? (
              <ErrorState message={getErrorMessage(historyQuery.error)} onRetry={() => void historyQuery.refetch()} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          activeQuery.isLoading || historyQuery.isLoading || activeQuery.isError || historyQuery.isError ? null : (
            <AppText tone="muted">No trips yet. Finished journeys collect here when the service has them.</AppText>
          )
        }
        renderItem={({ item }: { item: Trip }) => {
          const live = active.some((trip) => trip.id === item.id);
          return (
            <TripHistoryCard
              trip={item}
              detail={live ? 'Active' : routeRecordLabel({ simulated: item.simulated, pointCount: item.route?.length ?? 0 })}
              onPress={() => router.push(live ? `/trip/${item.id}` : `/replay/${item.id}`)}
            />
          );
        }}
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
  header: { gap: space.md, paddingBottom: space.lg },
});