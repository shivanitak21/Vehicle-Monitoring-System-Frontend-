import type { MapStyleElement } from 'react-native-maps';

export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#243044' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#D5DEEA' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#243044' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3C4E66' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3E536C' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#556980' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#5C7390' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#152033' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8EA0B8' }] },
];
