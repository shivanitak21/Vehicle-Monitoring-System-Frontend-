import { createId } from '@/lib/id';
import { toApiError } from '@/lib/errors';
import { pointAlong } from '@/lib/geo';
import { api } from '@/services/api/client';
import { ACTIVE_TRIP_ID, activeRoute } from '@/services/demo/fixtures';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import type { Evidence, Incident, RiskSnapshot, SafetyAlert, SafetyKind } from '@/types/models';

function scoreFromAlerts(alerts: SafetyAlert[]): RiskSnapshot {
  const count = (kind: SafetyKind) => alerts.filter((alert) => alert.kind === kind).length;
  const speeding = count('speeding');
  const fatigue = count('fatigue');
  const distraction = count('distraction');
  const sos = count('sos');
  const speech = count('abusive_language');
  const braking = count('harsh_braking');
  const occupancy = count('occupancy');
  return {
    score: Math.max(8, 94 - speeding * 6 - fatigue * 4 - distraction * 3 - sos * 18 - speech * 12 - braking * 5 - occupancy * 4),
    fatigue: Math.min(100, 12 + fatigue * 18),
    distraction: Math.min(100, 8 + distraction * 16),
    speeding: Math.min(100, 10 + speeding * 22),
    sosCount: sos,
    updatedAt: new Date().toISOString(),
    simulated: true,
  };
}

export async function getRiskSnapshot(): Promise<RiskSnapshot> {
  if (useAuthStore.getState().isDemo) return scoreFromAlerts(useDemoStore.getState().alerts);
  try {
    const response = await api.get<RiskSnapshot>('/safety/score');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getAlerts(): Promise<SafetyAlert[]> {
  if (useAuthStore.getState().isDemo) return useDemoStore.getState().alerts;
  try {
    const response = await api.get<SafetyAlert[]>('/safety/alerts');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getIncidents(): Promise<Incident[]> {
  if (useAuthStore.getState().isDemo) return useDemoStore.getState().incidents;
  try {
    const response = await api.get<Incident[]>('/safety/incidents');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getIncident(id: string): Promise<Incident> {
  if (useAuthStore.getState().isDemo) {
    const incident = useDemoStore.getState().incidents.find((item) => item.id === id);
    if (!incident) throw toApiError(new Error('That sample incident is no longer available.'));
    return incident;
  }
  try {
    const response = await api.get<Incident>(`/safety/incidents/${id}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function sendSos(tripId: string): Promise<Incident> {
  if (useAuthStore.getState().isDemo) {
    const { point } = pointAlong(activeRoute, 0.5);
    const incident: Incident = {
      id: createId('incident'),
      tripId: tripId || ACTIVE_TRIP_ID,
      kind: 'sos',
      severity: 'critical',
      title: 'Simulated SOS',
      summary:
        'A guardian confirmed a sample SOS. No emergency contact was notified, and this is not a live distress signal.',
      occurredAt: new Date().toISOString(),
      locationLabel: 'Sample position · Harbor District',
      coordinate: point,
      evidence: [],
      simulated: true,
      status: 'open',
    };
    const alert: SafetyAlert = {
      id: createId('alert'),
      tripId: incident.tripId,
      incidentId: incident.id,
      kind: 'sos',
      severity: 'critical',
      title: 'Simulated SOS',
      message: 'Sample distress signal created in demo mode. Nobody was contacted.',
      createdAt: incident.occurredAt,
      simulated: true,
    };
    useDemoStore.getState().addIncident(incident);
    useDemoStore.getState().pushAlert(alert);
    useLiveStore.getState().publishGuardian({
      reason: 'SOS button',
      at: incident.occurredAt,
      simulated: true,
    });
    return incident;
  }
  try {
    const response = await api.post<Incident>('/safety/sos', { tripId });
    useLiveStore.getState().publishGuardian({
      reason: 'SOS button',
      at: new Date().toISOString(),
      simulated: false,
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function uploadEvidence(incidentId: string, file: { uri: string; name: string; type: string; kind: 'photo' | 'video' }): Promise<Evidence> {
  if (useAuthStore.getState().isDemo) {
    const evidence: Evidence = {
      id: createId('evidence'),
      kind: file.kind,
      uri: file.uri,
      label: 'Added by you on this device. Demo mode does not upload it.',
      simulated: false,
      capturedAt: new Date().toISOString(),
    };
    useDemoStore.getState().addEvidence(incidentId, evidence);
    return evidence;
  }
  try {
    const body = new FormData();
    body.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    body.append('kind', file.kind);
    const response = await api.post<Evidence>(`/safety/incidents/${incidentId}/evidence`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
