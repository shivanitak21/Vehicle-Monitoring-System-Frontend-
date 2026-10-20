import * as ImagePicker from 'expo-image-picker';

export type CapturedMedia = {
  uri: string;
  kind: 'photo' | 'video';
  durationSec?: number;
};

export async function captureTripMedia(kind: 'photo' | 'video'): Promise<CapturedMedia | 'denied' | 'canceled'> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return 'denied';
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    quality: 0.7,
    videoMaxDuration: 15,
  });
  if (result.canceled) return 'canceled';
  const asset = result.assets[0];
  if (!asset?.uri) return 'canceled';
  const durationMs = asset.duration ?? 0;
  return {
    uri: asset.uri,
    kind: asset.type === 'video' ? 'video' : 'photo',
    durationSec: durationMs > 0 ? Math.max(1, Math.round(durationMs / 1000)) : undefined,
  };
}
