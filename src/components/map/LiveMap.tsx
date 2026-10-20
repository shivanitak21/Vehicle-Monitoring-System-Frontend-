import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { WebView, type WebView as WebViewType } from 'react-native-webview';
import { AppText } from '@/components/ui/AppText';
import { VehicleMarker } from '@/components/map/VehicleMarker';
import { colors, radius } from '@/constants/theme';
import { harborRegion } from '@/lib/geo';
import type { LatLng } from '@/types/models';

type Props = {
  route?: LatLng[];
  coordinate?: LatLng;
  heading?: number;
  showsUserLocation?: boolean;
  interactive?: boolean;
};

type Size = { width: number; height: number };

const android = process.env.EXPO_OS === 'android';

export function LiveMap(props: Props) {
  if (process.env.EXPO_OS === 'web') {
    return (
      <View style={styles.fallback}>
        <AppText variant="title">Map preview</AppText>
        <AppText tone="muted">Open Velora on Android or iOS to see the live map.</AppText>
      </View>
    );
  }

  if (android) return <AndroidTileMap {...props} />;
  return <NativeMap {...props} />;
}

function AndroidTileMap({ route = [], coordinate, heading = 0, interactive = true }: Props) {
  const webRef = useRef<WebViewType>(null);
  const ready = useRef(false);
  const html = useMemo(() => tileMapHtml(interactive), [interactive]);
  const payload = useMemo(
    () =>
      JSON.stringify({
        route: route.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
        coordinate: coordinate ? { latitude: coordinate.latitude, longitude: coordinate.longitude } : null,
        heading,
      }),
    [route, coordinate, heading],
  );

  const push = () => {
    if (!ready.current || !webRef.current) return;
    webRef.current.injectJavaScript(`window.updateMap(${payload}); true;`);
  };

  useEffect(() => {
    ready.current = false;
  }, [html]);

  useEffect(() => {
    if (!ready.current || !webRef.current) return;
    webRef.current.injectJavaScript(`window.updateMap(${payload}); true;`);
  }, [payload]);

  return (
    <View style={styles.host} collapsable={false}>
      <WebView
        ref={webRef}
        style={styles.web}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://basemaps.cartocdn.com' }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        setSupportMultipleWindows={false}
        androidLayerType="hardware"
        cacheEnabled
        onLoadEnd={() => {
          ready.current = true;
          push();
        }}
        onMessage={() => undefined}
      />
    </View>
  );
}

function NativeMap({ route = [], coordinate, heading = 0, showsUserLocation = false, interactive = true }: Props) {
  const mapRef = useRef<MapView>(null);
  const [size, setSize] = useState<Size | null>(null);

  const fitRoute = (nextSize: Size) => {
    if (!mapRef.current || route.length < 2 || nextSize.height < 80) return;
    const padding = {
      top: Math.min(120, nextSize.height * 0.16),
      right: 36,
      bottom: Math.min(240, nextSize.height * 0.34),
      left: 36,
    };
    if (padding.top + padding.bottom >= nextSize.height - 20) return;
    mapRef.current.fitToCoordinates(route, { edgePadding: padding, animated: false });
  };

  useEffect(() => {
    if (size) fitRoute(size);
  }, [route, size]);

  return (
    <View
      style={styles.host}
      collapsable={false}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width < 2 || height < 2) return;
        setSize((current) => (current?.width === width && current.height === height ? current : { width, height }));
      }}
    >
      {size ? (
        <MapView
          ref={mapRef}
          style={{ width: size.width, height: size.height }}
          provider={process.env.EXPO_OS === 'android' ? PROVIDER_GOOGLE : undefined}
          userInterfaceStyle="dark"
          initialRegion={harborRegion}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={false}
          rotateEnabled={interactive}
          pitchEnabled={false}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          onMapReady={() => fitRoute(size)}
        >
          {route.length > 1 ? <Polyline coordinates={route} strokeColor={colors.lime} strokeWidth={4} lineCap="round" /> : null}
          {coordinate ? (
            <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges>
              <VehicleMarker heading={heading} />
            </Marker>
          ) : null}
        </MapView>
      ) : null}
    </View>
  );
}

function tileMapHtml(interactive: boolean) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; height: 100%; background: #152033; overflow: hidden; touch-action: none; }
  #tiles, #overlay { position: fixed; inset: 0; }
  #overlay { pointer-events: none; }
  #credit { position: fixed; right: 10px; top: 46%; color: #8EA0B8; font: 10px sans-serif; opacity: 0.85; }
  img { position: absolute; width: 256px; height: 256px; }
</style>
</head>
<body>
<div id="tiles"></div>
<canvas id="overlay"></canvas>
<div id="credit">© OpenStreetMap © CARTO</div>
<script>
  const TILE = 256;
  const interactive = ${interactive ? 'true' : 'false'};
  const tiles = document.getElementById('tiles');
  const canvas = document.getElementById('overlay');
  const ctx = canvas.getContext('2d');
  let zoom = 13;
  let origin = project(37.798, -122.445, zoom);
  let route = [];
  let marker = null;
  let heading = 0;
  let fitted = false;
  let userMoved = false;
  const pointers = new Map();

  function project(lat, lng, z) {
    const n = TILE * Math.pow(2, z);
    const x = ((lng + 180) / 360) * n;
    const s = Math.sin(lat * Math.PI / 180);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
    return { x: x, y: y };
  }

  function unproject(x, y, z) {
    const n = TILE * Math.pow(2, z);
    const lng = (x / n) * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180 / Math.PI;
    return { lat: lat, lng: lng };
  }

  function padding() {
    const h = window.innerHeight;
    if (h < 380) return { top: 20, right: 20, bottom: 20, left: 20 };
    return {
      top: Math.min(150, h * 0.18),
      right: 40,
      bottom: Math.min(300, h * 0.4),
      left: 40,
    };
  }

  function fit(points) {
    if (!points.length || userMoved) return;
    const pad = padding();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const innerW = Math.max(40, viewW - pad.left - pad.right);
    const innerH = Math.max(40, viewH - pad.top - pad.bottom);
    let chosen = 11;
    for (let z = 16; z >= 11; z--) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach((p) => {
        const w = project(p.latitude, p.longitude, z);
        minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x);
        minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y);
      });
      if (maxX - minX <= innerW && maxY - minY <= innerH) { chosen = z; break; }
    }
    zoom = chosen;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    points.forEach((p) => {
      minLat = Math.min(minLat, p.latitude); maxLat = Math.max(maxLat, p.latitude);
      minLng = Math.min(minLng, p.longitude); maxLng = Math.max(maxLng, p.longitude);
    });
    const world = project((minLat + maxLat) / 2, (minLng + maxLng) / 2, zoom);
    origin = {
      x: world.x - (pad.left - pad.right) / 2,
      y: world.y - (pad.top - pad.bottom) / 2,
    };
    fitted = true;
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  }

  function render() {
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const left = origin.x - viewW / 2;
    const top = origin.y - viewH / 2;
    const scale = Math.pow(2, zoom);
    const x0 = Math.floor(left / TILE);
    const y0 = Math.floor(top / TILE);
    const x1 = Math.floor((left + viewW) / TILE);
    const y1 = Math.floor((top + viewH) / TILE);
    const keep = {};
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        if (y < 0 || y >= scale) continue;
        const wrapped = ((x % scale) + scale) % scale;
        const id = 't' + zoom + '-' + wrapped + '-' + y + '-' + x;
        keep[id] = true;
        let img = document.getElementById(id);
        if (!img) {
          img = document.createElement('img');
          img.id = id;
          img.alt = '';
          img.src = 'https://a.basemaps.cartocdn.com/dark_all/' + zoom + '/' + wrapped + '/' + y + '.png';
          tiles.appendChild(img);
        }
        img.style.left = (x * TILE - left) + 'px';
        img.style.top = (y * TILE - top) + 'px';
      }
    }
    Array.from(tiles.children).forEach((img) => { if (!keep[img.id]) img.remove(); });
    ctx.clearRect(0, 0, viewW, viewH);
    if (route.length > 1) {
      ctx.beginPath();
      route.forEach((p, index) => {
        const s = screenOf(p.latitude, p.longitude);
        if (index === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.strokeStyle = '#D6FF4A';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    if (marker) {
      const s = screenOf(marker.latitude, marker.longitude);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(heading * Math.PI / 180);
      ctx.fillStyle = '#D6FF4A';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070B12';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function screenOf(lat, lng) {
    const w = project(lat, lng, zoom);
    return {
      x: window.innerWidth / 2 + (w.x - origin.x),
      y: window.innerHeight / 2 + (w.y - origin.y),
    };
  }

  function zoomAt(nextZoom, screenX, screenY) {
    const clamped = Math.max(11, Math.min(17, nextZoom));
    if (clamped === zoom) return;
    const worldX = origin.x + (screenX - window.innerWidth / 2);
    const worldY = origin.y + (screenY - window.innerHeight / 2);
    const ll = unproject(worldX, worldY, zoom);
    zoom = clamped;
    const next = project(ll.lat, ll.lng, zoom);
    origin = {
      x: next.x - (screenX - window.innerWidth / 2),
      y: next.y - (screenY - window.innerHeight / 2),
    };
    tiles.innerHTML = '';
    render();
  }

  window.updateMap = function (data) {
    route = data.route || [];
    marker = data.coordinate;
    heading = data.heading || 0;
    if (!fitted && route.length > 1) fit(route);
    render();
  };

  if (interactive) {
    document.addEventListener('pointerdown', (event) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    });
    document.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      const previous = Array.from(pointers.values());
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = Array.from(pointers.values());
      if (current.length === 1 && previous.length === 1) {
        origin.x -= current[0].x - previous[0].x;
        origin.y -= current[0].y - previous[0].y;
        userMoved = true;
        render();
      } else if (current.length === 2 && previous.length === 2) {
        const before = Math.hypot(previous[0].x - previous[1].x, previous[0].y - previous[1].y);
        const after = Math.hypot(current[0].x - current[1].x, current[0].y - current[1].y);
        if (before > 0 && Math.abs(after - before) > 8) {
          const midX = (current[0].x + current[1].x) / 2;
          const midY = (current[0].y + current[1].y) / 2;
          zoomAt(zoom + (after > before ? 1 : -1), midX, midY);
          userMoved = true;
        }
      }
    });
    document.addEventListener('pointerup', (event) => pointers.delete(event.pointerId));
    document.addEventListener('pointercancel', (event) => pointers.delete(event.pointerId));
  }

  window.addEventListener('resize', resize);
  resize();
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: '#152033' },
  web: { flex: 1, backgroundColor: '#152033' },
  fallback: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
});
