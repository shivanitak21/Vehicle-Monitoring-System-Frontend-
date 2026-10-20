import axios from 'axios';
import { toApiError } from '@/lib/errors';
import { api } from '@/services/api/client';
import { ACTIVE_TRIP_ID, ARIA_ID, createActiveTrip, createHistory } from '@/services/demo/fixtures';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import type { HistoryPage, LatLng, Trip } from '@/types/models';

function withConsent(trip: Trip): Trip {
  const member = useDemoStore.getState().members.find((item) => item.id === trip.passengerId);
  if (!member) return trip;
  const granted = member.consent === 'granted' && member.sharingLocation;
  return {
    ...trip,
    consent: granted ? 'granted' : member.consent === 'pending' ? 'pending' : 'revoked',
    relationship: member.relationship,
  };
}

export async function getActiveTrips(): Promise<Trip[]> {
  if (useAuthStore.getState().isDemo) {
    const passenger = useDemoStore.getState().members.find((member) => member.id === ARIA_ID);
    if (!passenger) return [];
    return [withConsent(createActiveTrip())];
  }
  try {
    const response = await api.get<Trip | Trip[] | null>('/trips/active');
    const data = response.data;
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return [];
    throw toApiError(error);
  }
}

export async function getActiveTrip(): Promise<Trip | null> {
  const trips = await getActiveTrips();
  return trips[0] ?? null;
}

export async function getTrip(id: string): Promise<Trip> {
  if (useAuthStore.getState().isDemo) {
    const active = withConsent(createActiveTrip());
    if (id === active.id || id === ACTIVE_TRIP_ID) return active;
    const historical = createHistory().find((trip) => trip.id === id);
    if (!historical) throw toApiError(new Error('That sample trip is no longer available.'));
    return withConsent(historical);
  }
  try {
    const response = await api.get<Trip>(`/trips/${id}`);
    if (response.data.route?.length) return response.data;
    const route = await api.get<{ coordinates: LatLng[] }>(`/trips/${id}/route`);
    return { ...response.data, route: route.data.coordinates };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getTripHistory(cursor?: string): Promise<HistoryPage> {
  if (useAuthStore.getState().isDemo) {
    return { items: createHistory().map(withConsent), nextCursor: null };
  }
  try {
    const response = await api.get<HistoryPage>('/trips/history', { params: { cursor } });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
