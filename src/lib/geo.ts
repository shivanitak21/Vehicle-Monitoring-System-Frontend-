import type { LatLng } from '@/types/models';

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export function densify(points: LatLng[], stepsPerSegment = 14): LatLng[] {
  if (points.length < 2) return [...points];
  const route: LatLng[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (!start || !end) continue;
    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      route.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  }
  const last = points[points.length - 1];
  if (last) route.push(last);
  return route;
}

export function bearing(start: LatLng, end: LatLng): number {
  const y = Math.sin(toRadians(end.longitude - start.longitude)) * Math.cos(toRadians(end.latitude));
  const x =
    Math.cos(toRadians(start.latitude)) * Math.sin(toRadians(end.latitude)) -
    Math.sin(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.cos(toRadians(end.longitude - start.longitude));
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function pointAlong(route: LatLng[], progress: number): { point: LatLng; heading: number } {
  if (route.length === 0) {
    return { point: { latitude: 37.795, longitude: -122.44 }, heading: 0 };
  }
  const clamped = Math.min(1, Math.max(0, progress));
  const scaled = clamped * (route.length - 1);
  const index = Math.min(route.length - 1, Math.floor(scaled));
  const nextIndex = Math.min(route.length - 1, index + 1);
  const start = route[index] ?? route[0]!;
  const end = route[nextIndex] ?? start;
  const t = scaled - index;
  return {
    point: {
      latitude: start.latitude + (end.latitude - start.latitude) * t,
      longitude: start.longitude + (end.longitude - start.longitude) * t,
    },
    heading: bearing(start, end),
  };
}

export const harborRegion = {
  latitude: 37.798,
  longitude: -122.445,
  latitudeDelta: 0.09,
  longitudeDelta: 0.07,
};
