import { useState } from 'react';
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
  const [playing, setPlaying] = useState(false);
  return (
    <View style={styles.card}>
      {item.kind === 'photo' && item.uri ? (
        <Image source={{ uri: item.uri }} style={styles.media} contentFit="cover" />
      ) : null}
      {item.kind === 'video' && item.uri ? <ClipPlayer uri={item.uri} /> : null}
      {item.kind === 'photo' && !item.uri ? <SampleStill /> : null}
      {item.kind === 'video' && !item.uri ? (
        <Pressable style={styles.sampleClip} onPress={() => setPlaying((value) => !value)}>
          <AppText variant="label" tone="lime">
            {playing ? 'PLAYING SAMPLE' : 'SAMPLE CLIP'}
          </AppText>
          <AppText tone="muted">{playing ? 'Seat count stays at 2. Rear left remains occupied.' : 'Tap to play the sample clip.'}</AppText>
        </Pressable>
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

function SampleStill() {
  return (
    <View style={styles.still}>
      <AppText variant="label" tone="lime">
        CABIN STILL
      </AppText>
      <View style={styles.seatRow}>
        <View style={styles.seat}>
          <AppText variant="caption">L</AppText>
        </View>
        <View style={styles.seatEmpty} />
      </View>
      <View style={styles.seatRow}>
        <View style={[styles.seat, styles.seatOn]}>
          <AppText variant="caption" tone="lime">
            A
          </AppText>
        </View>
        <View style={styles.seatEmpty} />
      </View>
    </View>
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
