import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CabinCameras } from '@/components/cabin/CabinCameras';
import { TripMedia } from '@/components/cabin/TripMedia';
import { AlertRow } from '@/components/safety/AlertRow';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, radius } from '@/constants/theme';
import { captureTripMedia } from '@/lib/capture-media';
import { createId } from '@/lib/id';
import { formatRelative } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { useRouter } from 'expo-router';

export default function CabinScreen() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const cabin = useLiveStore((state) => state.cabin);
  const captures = useLiveStore((state) => state.captures);
  const addCapture = useLiveStore((state) => state.addCapture);
  const notice = useLiveStore((state) => state.guardianNotice);
  const liveEvents = useLiveStore((state) => state.events);
  const demoAlerts = useDemoStore((state) => state.alerts);
  const cameraEvidence = usePreferencesStore((state) => state.privacy.cameraEvidence);
  const speechMonitoring = usePreferencesStore((state) => state.privacy.speechMonitoring);
  const setCabinCheck = useLiveStore((state) => state.setCabinCheck);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const confirmStill = () => {
    if (!cabin || busy) return;
    setBusy(true);
    setCabinCheck('checking', 'The vehicle is reading the cabin still.');
    setTimeout(() => {
      if (!alive.current) return;
      const passenger = cabin.seats.find((seat) => seat.role === 'passenger');
      const where = passenger?.occupant ? `${passenger.occupant} is in the ${passenger.label.toLowerCase()} seat` : 'No passenger seat is filled';
      setCabinCheck(
        'confirmed',
        isDemo
          ? `Simulated local model: ${cabin.seatCount} people. ${where}. This is not a real photo.`
          : `Vehicle model: ${cabin.seatCount} people. ${where}.`,
      );
      setBusy(false);
    }, 900);
  };

  const record = async (kind: 'photo' | 'video') => {
    if (!cameraEvidence) {
      setMessage('Turn on pictures and video in Privacy before recording.');
      return;
    }
    setMessage(null);
    setBusy(true);
    try {
      const result = await captureTripMedia(kind);
      if (result === 'denied') {
        setMessage('Camera permission stayed off, so nothing was recorded.');
        return;
      }
      if (result === 'canceled') return;
      addCapture({
        id: createId(kind === 'video' ? 'clip' : 'still'),
        kind: result.kind,
        uri: result.uri,
        durationSec: result.durationSec,
        label: kind === 'video' ? 'Clip you recorded on this phone' : 'Picture you took on this phone',
        simulated: false,
        capturedAt: new Date().toISOString(),
      });
      setMessage(isDemo ? 'Saved on this phone. Demo mode did not upload it.' : 'Saved on this phone.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const activities = (isDemo ? demoAlerts : liveEvents)
    .filter((alert) => (cabin ? alert.tripId === cabin.tripId : true))
    .filter((alert) => speechMonitoring || alert.kind !== 'abusive_language')
    .slice(0, 6);

  return (
    <Screen withHeader>
      <DemoBanner />
      <AppText variant="label" tone="lime">
        CABIN MONITOR
      </AppText>
      <AppText variant="display" style={styles.title}>
        Who is in the vehicle
      </AppText>
      {notice ? (
        <Card style={styles.notice}>
          <StatusPill label="Guardian page" tone="critical" />
          <AppText variant="title">{notice.reason}</AppText>
          <AppText tone="muted">
            {notice.simulated
              ? 'Demo only. A high risk score or SOS would publish this page to guardians over MQTT. Nobody was contacted.'
              : 'This page was published to guardians because of the event below.'}{' '}
            {formatRelative(notice.at)}.
          </AppText>
        </Card>
      ) : (
        <AppText tone="muted">
          The face camera and the cabin camera stay on the vehicle. This screen shows the live state they report.
        </AppText>
      )}
      {cabin ? (
        <>
          <CabinCameras cabin={cabin} />
          <TripMedia captures={captures} busy={busy} onPicture={() => void record('photo')} onVideo={() => void record('video')} />
          {message ? <AppText tone="muted">{message}</AppText> : null}
          {!cameraEvidence ? (
            <Button label="Allow pictures and video" variant="ghost" onPress={() => router.push('/privacy')} />
          ) : null}
          <AppText variant="title">Activity</AppText>
          {activities.length === 0 ? (
            <AppText tone="muted">No fatigue, distraction, braking, seat, or speech events on this trip yet.</AppText>
          ) : (
            activities.map((alert) => <AlertRow key={alert.id} alert={alert} />)
          )}
          <View style={styles.grid}>
            <StateCell label="Face model" value={cabin.gazeLabel} />
            <StateCell label="Seat count" value={String(cabin.seatCount)} />
            <StateCell label="Driver" value={cabin.driverName} />
            <StateCell label="Passenger" value={cabin.passengerName} />
          </View>
          <Card>
            <AppText variant="label" tone="muted">
              SEATS
            </AppText>
            {cabin.seats.map((seat) => (
              <View key={seat.id} style={styles.seatLine}>
                <AppText style={styles.flex}>{seat.label}</AppText>
                <AppText tone={seat.occupant ? 'lime' : 'dim'}>{seat.occupant ?? 'Empty'}</AppText>
              </View>
            ))}
          </Card>
          <Card>
            <AppText variant="label" tone="muted">
              CABIN STILL
            </AppText>
            <AppText tone="muted">
              {cabin.vlm.status === 'idle'
                ? 'An optional model on the vehicle can confirm the cabin still without sending the image here.'
                : cabin.vlm.note}
            </AppText>
            <Button
              label={cabin.vlm.status === 'checking' ? 'Reading the still' : 'Confirm cabin still'}
              variant="secondary"
              loading={busy || cabin.vlm.status === 'checking'}
              onPress={confirmStill}
            />
          </Card>
          <AppText variant="caption" tone="dim">
            Updated {formatRelative(cabin.updatedAt)}
            {cabin.simulated ? ' · Sample state, not a recording' : ''}
          </AppText>
        </>
      ) : (
        <Card>
          <AppText variant="title">No cabin report yet</AppText>
          <AppText tone="muted">
            When a shared trip is active, the driver face model and the cabin seat count appear here.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

function StateCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <AppText variant="caption" tone="dim">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 36 },
  notice: { borderColor: 'rgba(255, 93, 115, 0.45)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  seatLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
