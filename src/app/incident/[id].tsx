import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatusPill } from '@/components/ui/StatusPill';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { formatClock } from '@/lib/format';
import { getIncident, uploadEvidence } from '@/services/api/safety';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export default function IncidentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isDemo = useAuthStore((state) => state.isDemo);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const cameraEvidence = usePreferencesStore((state) => state.privacy.cameraEvidence);
  const [message, setMessage] = useState<string | null>(null);
  const incidentQuery = useQuery({
    queryKey: ['incidents', id, isDemo],
    queryFn: () => getIncident(id ?? ''),
    enabled: Boolean(id) && (!isDemo || demoHydrated),
  });
  const upload = useMutation({
    mutationFn: (file: { uri: string; name: string; type: string; kind: 'photo' | 'video' }) =>
      uploadEvidence(id ?? '', file),
    onSuccess: async () => {
      setMessage(isDemo ? 'Saved on this device. Demo mode did not upload it.' : 'Evidence attached.');
      await queryClient.invalidateQueries({ queryKey: ['incidents', id, isDemo] });
    },
    onError: (error) => setMessage(getErrorMessage(error)),
  });

  const capture = async (source: 'camera' | 'library') => {
    if (!cameraEvidence) {
      setMessage('Turn on camera evidence in Privacy before attaching a photo or video.');
      return;
    }
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('Permission stayed off, so nothing was captured.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 0.7, videoMaxDuration: 15 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    const kind = asset.type === 'video' ? 'video' : 'photo';
    upload.mutate({
      uri: asset.uri,
      name: asset.fileName ?? `evidence.${kind === 'video' ? 'mp4' : 'jpg'}`,
      type: asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      kind,
    });
  };

  const incident = incidentQuery.data;

  return (
    <Screen withHeader>
      <DemoBanner />
      {incidentQuery.isLoading ? <LoadingState label="Opening the incident" /> : null}
      {incidentQuery.isError ? (
        <ErrorState message={getErrorMessage(incidentQuery.error)} onRetry={() => void incidentQuery.refetch()} />
      ) : null}
      {incident ? (
        <>
          <View style={styles.row}>
            <StatusPill label={incident.severity} tone={incident.severity} />
            <StatusPill label={incident.status} tone={incident.status === 'resolved' ? 'info' : 'watch'} />
          </View>
          <AppText variant="display" style={styles.title}>
            {incident.title}
          </AppText>
          <AppText tone="muted">{incident.summary}</AppText>
          <AppText variant="caption" tone="dim">
            {formatClock(incident.occurredAt)} · {incident.locationLabel}
            {incident.simulated ? ' · Simulated record' : ''}
          </AppText>
          <AppText variant="title">Evidence</AppText>
          {incident.evidence.length === 0 ? (
            <AppText tone="muted">No photo or video is attached. Capture only if you mean to add it to this report.</AppText>
          ) : null}
          {incident.evidence.map((item) => (
            <Card key={item.id}>
              {item.uri ? (
                <Image source={{ uri: item.uri }} style={styles.media} contentFit="cover" />
              ) : (
                <View style={styles.placeholder}>
                  <AppText variant="label" tone="lime">
                    {item.kind === 'video' ? 'SAMPLE CLIP' : 'SAMPLE STILL'}
                  </AppText>
                </View>
              )}
              <AppText tone="muted">{item.label}</AppText>
              <AppText variant="caption" tone="dim">
                {formatClock(item.capturedAt)}
                {item.simulated ? ' · Not a real recording' : ' · Added by you'}
              </AppText>
            </Card>
          ))}
          {message ? <AppText tone="muted">{message}</AppText> : null}
          <Button label="Capture evidence" loading={upload.isPending} onPress={() => void capture('camera')} />
          <Button label="Choose from library" variant="secondary" onPress={() => void capture('library')} />
          {!cameraEvidence ? (
            <Button label="Review evidence consent" variant="ghost" onPress={() => router.push('/privacy')} />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 32, lineHeight: 36 },
  media: { height: 180, borderRadius: radius.md, backgroundColor: colors.surface2 },
  placeholder: {
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
