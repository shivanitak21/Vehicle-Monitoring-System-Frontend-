import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppText } from '@/components/ui/AppText';
import { colors, radius } from '@/constants/theme';
import { formatRelative } from '@/lib/format';
import type { CabinCapture } from '@/types/models';

export function TripMedia({
  captures,
  onPicture,
  onVideo,
  busy,
}: {
  captures: CabinCapture[];
  onPicture: () => void;
  onVideo: () => void;
  busy?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <AppText variant="title">Pictures and video</AppText>
      <AppText tone="muted">
        Stills and clips are saved only when you record them, or when the vehicle sends a consented cabin frame. Demo samples are not recordings.
      </AppText>
      <View style={styles.actions}>
        <Pressable style={styles.action} disabled={busy} onPress={onPicture}>
          <AppText tone="lime">Take picture</AppText>
        </Pressable>
        <Pressable style={styles.action} disabled={busy} onPress={onVideo}>
          <AppText tone="lime">Record video</AppText>
        </Pressable>
      </View>
      {captures.map((item) => (
        <CaptureCard key={item.id} item={item} />
      ))}
    </View>
  );
}

function CaptureCard({ item }: { item: CabinCapture }) {
  return (
    <View style={styles.card}>
      {item.kind === 'photo' && item.uri ? (
        <Image source={{ uri: item.uri }} style={styles.media} contentFit="cover" />
      ) : null}
      {item.kind === 'video' && item.uri ? <ClipPlayer uri={item.uri} /> : null}
      {!item.uri ? (
        <View style={styles.sampleClip}>
          <AppText variant="label">{item.simulated ? 'DEMO' : 'Unavailable'}</AppText>
          <AppText tone="muted">
            {item.simulated ? 'No recording is attached to this sample.' : 'The file is missing or no longer available.'}
          </AppText>
        </View>
      ) : null}
      <AppText>{item.label}</AppText>
      <AppText variant="caption" tone="dim">
        {item.kind === 'video' ? `Video${item.durationSec ? ` · ${item.durationSec}s` : ''}` : 'Picture'}
        {' · '}
        {formatRelative(item.capturedAt)}
        {item.simulated ? ' · Simulated, not a recording' : ' · Saved on this phone'}
      </AppText>
    </View>
  );
}

function ClipPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });
  return (
    <VideoView
      player={player}
      style={styles.media}
      nativeControls
      contentFit="cover"
      surfaceType="textureView"
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  media: { height: 180, borderRadius: radius.md, backgroundColor: colors.black },
  still: {
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sampleClip: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  seatRow: { flexDirection: 'row', gap: 8 },
  seat: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatOn: { borderWidth: 1, borderColor: colors.lime, backgroundColor: 'rgba(214, 255, 74, 0.16)' },
  seatEmpty: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
