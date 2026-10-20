import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { previewSafetyNotification, requestNotificationPermission, syncPushToken } from '@/services/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import type { NotificationPrefs } from '@/types/models';

const rows: { key: keyof NotificationPrefs; title: string; body: string }[] = [
  { key: 'tripStart', title: 'Trip started', body: 'When a shared journey begins.' },
  { key: 'arrival', title: 'Arrival', body: 'When a passenger reaches the destination.' },
  { key: 'speeding', title: 'Speeding', body: 'When speed stays over the limit.' },
  { key: 'fatigue', title: 'Fatigue', body: 'When a fatigue signal crosses the watch line.' },
  { key: 'sos', title: 'SOS', body: 'When someone confirms an emergency alert.' },
];

export default function NotificationsScreen() {
  const isDemo = useAuthStore((state) => state.isDemo);
  const prefs = usePreferencesStore((state) => state.notifications);
  const setNotifications = usePreferencesStore((state) => state.setNotifications);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const blocked = await requestNotificationPermission();
      if (blocked) {
        setMessage(blocked);
        return;
      }
      await setNotifications({ pushEnabled: true });
      const tokenNote = await syncPushToken();
      setMessage(tokenNote ?? (isDemo ? 'Permission is on. Demo mode does not register a live push token.' : 'This device can receive Velora alerts.'));
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
        Velora asks for notification permission only from this screen. Category switches save what you want to hear. They do not send a test to anyone else.
      </AppText>
      <Card>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.copy}>
              <AppText variant="title" style={styles.title}>
                {row.title}
              </AppText>
              <AppText tone="muted">{row.body}</AppText>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={(value) => {
                void setNotifications({ [row.key]: value }).catch((error) => setMessage(getErrorMessage(error)));
              }}
              trackColor={{ false: colors.surface2, true: colors.limeDeep }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </Card>
      {message ? <AppText tone="muted">{message}</AppText> : null}
      <Button label={prefs.pushEnabled ? 'Notifications allowed' : 'Allow notifications'} onPress={() => void enable()} loading={busy} />
      <Button
        label="Preview a demo alert"
        variant="secondary"
        onPress={() => {
          void previewSafetyNotification('incident-speed')
            .then(() => setMessage('A local demo notification was scheduled on this device.'))
            .catch((error) => setMessage(getErrorMessage(error)));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 16 },
});
