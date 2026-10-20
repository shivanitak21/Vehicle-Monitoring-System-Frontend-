import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import {
  enableBackgroundSharing,
  enableForegroundSharing,
  stopAllLocationSharing,
  stopBackgroundUpdates,
} from '@/services/location';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export default function PrivacyScreen() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const privacy = usePreferencesStore((state) => state.privacy);
  const setPrivacy = usePreferencesStore((state) => state.setPrivacy);
  const [message, setMessage] = useState<string | null>(
    'Location and camera stay off until you turn a switch on. Velora explains each request before the system prompt.',
  );
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen withHeader>
      <DemoBanner />
      <AppText tone="muted">
        These switches control this phone. They do not turn on a family member’s location. In demo mode, nothing is uploaded.
      </AppText>
      {message ? <AppText variant="caption" tone="dim">{message}</AppText> : null}
      <Card>
        <Row
          title="Share with guardians"
          body="Marks that you are willing for approved guardians to see trips from this account."
          value={privacy.shareWithGuardians}
          disabled={busy}
          onChange={(value) => {
            void run(async () => {
              await setPrivacy({ shareWithGuardians: value });
              setMessage(value ? 'Guardians can see trips you choose to share.' : 'Guardian visibility for your trips is off.');
            });
          }}
        />
        <Row
          title="Share while the app is open"
          body="Reads this phone’s location and, outside demo mode, sends it to your safety service."
          value={privacy.foregroundSharing}
          disabled={busy}
          onChange={(value) => {
            void run(async () => {
              if (!value) {
                await stopAllLocationSharing();
                await setPrivacy({ foregroundSharing: false, backgroundSharing: false });
                setMessage('This phone is no longer sharing location.');
                return;
              }
              const blocked = await enableForegroundSharing();
              if (blocked) {
                setMessage(blocked);
                return;
              }
              await setPrivacy({ foregroundSharing: true });
              setMessage(
                isDemo
                  ? 'Foreground permission is on. Demo mode will not upload your position.'
                  : 'This phone shares location while Velora is open.',
              );
            });
          }}
        />
        <Row
          title="Share while the app is closed"
          body="Continues an active share in the background. Android shows a persistent notice. A development build is required for reliable background updates."
          value={privacy.backgroundSharing}
          disabled={busy || !privacy.foregroundSharing}
          onChange={(value) => {
            void run(async () => {
              if (!value) {
                await stopBackgroundUpdates();
                await setPrivacy({ backgroundSharing: false });
                setMessage('Background sharing is off.');
                return;
              }
              const blocked = await enableBackgroundSharing();
              if (blocked) {
                setMessage(blocked);
                return;
              }
              await setPrivacy({ backgroundSharing: true, foregroundSharing: true });
              setMessage(
                isDemo
                  ? 'Background permission is on. Demo mode still does not upload your position.'
                  : 'Background sharing is on for this phone.',
              );
            });
          }}
        />
        <Row
          title="Allow pictures and video"
          body="Lets you take a picture or record up to 15 seconds when you tap the button. The camera stays closed until then."
          value={privacy.cameraEvidence}
          disabled={busy}
          onChange={(value) => {
            void run(async () => {
              await setPrivacy({ cameraEvidence: value });
              setMessage(value ? 'You can take a picture or record a short clip from the cabin screen.' : 'Picture and video capture is off.');
            });
          }}
        />
        <Row
          title="Show speech alerts"
          body="Lets guardians see abusive-language alerts from the vehicle. This phone does not listen, and the words are not stored. A real trip sends this only after the passenger has agreed on the vehicle."
          value={Boolean(privacy.speechMonitoring)}
          disabled={busy}
          onChange={(value) => {
            void run(async () => {
              await setPrivacy({ speechMonitoring: value });
              setMessage(value ? 'Speech alerts can appear. Demo detections stay labeled as samples.' : 'Speech alerts are hidden.');
            });
          }}
        />
      </Card>
    </Screen>
  );
}

function Row({
  title,
  body,
  value,
  onChange,
  disabled,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        <AppText tone="muted">{body}</AppText>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.surface2, true: colors.limeDeep }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 16 },
});
