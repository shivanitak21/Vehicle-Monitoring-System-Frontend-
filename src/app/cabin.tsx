import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CabinCameras } from '@/components/cabin/CabinCameras';
import { TripMedia } from '@/components/cabin/TripMedia';
import { AlertRow } from '@/components/safety/AlertRow';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';
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
      <ScreenHeader
        title="Cabin"
        detail="Camera, inference, and recording are shown separately. A live picture appears only when the vehicle sends one."
      />
      {notice ? (
        <Card style={styles.notice}>
          <StatusPill label="Guardian page" tone="critical" />
          <AppText variant="title">{notice.reason}</AppText>
          <AppText tone="muted">
            {notice.simulated
              ? 'Demo only. Nobody was contacted, and emergency services were not called.'
              : 'Authorized guardians were notified through the safety service. Emergency services were not contacted by this screen.'}{' '}
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
            <AppText tone="muted">No fatigue, distraction, braking, seat, or speech events on this trip yet. That does not mean the cabin is verified safe.</AppText>
          ) : (
            activities.map((alert) => <AlertRow key={alert.id} alert={alert} />)
          )}
          <Card>
            <AppText variant="label" tone="muted">
              VEHICLE REPORT
            </AppText>
            <AppText tone="muted">
              {cabin.vlm.note
                ? cabin.vlm.note
                : 'No cabin still has been sent. This phone does not invent a face, seat, or speech result.'}
            </AppText>
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

const styles = StyleSheet.create({
  notice: { borderColor: 'rgba(255, 93, 115, 0.45)' },
});
