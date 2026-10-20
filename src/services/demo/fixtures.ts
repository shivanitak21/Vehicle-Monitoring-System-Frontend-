import { densify } from '@/lib/geo';
import type {
  Driver,
  EmergencyContact,
  Evidence,
  FamilyMember,
  Incident,
  LatLng,
  NotificationPrefs,
  PrivacySettings,
  SafetyAlert,
  Trip,
  User,
} from '@/types/models';

export const DEMO_USER: User = {
  id: 'user-demo-guardian',
  name: 'Meera Shah',
  email: 'meera@velora.dev',
  role: 'guardian',
  phone: '+1 415 555 0148',
};

export const ACTIVE_TRIP_ID = 'trip-aria-live';
export const ARIA_ID = 'member-aria';
export const NOAH_ID = 'member-noah';

const schoolWaypoints: LatLng[] = [
  { latitude: 37.7849, longitude: -122.4094 },
  { latitude: 37.7892, longitude: -122.4198 },
  { latitude: 37.7948, longitude: -122.4312 },
  { latitude: 37.8004, longitude: -122.4446 },
  { latitude: 37.8051, longitude: -122.4568 },
  { latitude: 37.8086, longitude: -122.4684 },
  { latitude: 37.8094, longitude: -122.4762 },
];

const clinicWaypoints: LatLng[] = [
  { latitude: 37.7698, longitude: -122.4462 },
  { latitude: 37.7744, longitude: -122.4375 },
  { latitude: 37.7796, longitude: -122.4288 },
  { latitude: 37.7841, longitude: -122.4194 },
  { latitude: 37.7877, longitude: -122.4118 },
];

const practiceWaypoints: LatLng[] = [
  { latitude: 37.8021, longitude: -122.4187 },
  { latitude: 37.7994, longitude: -122.4295 },
  { latitude: 37.7958, longitude: -122.4411 },
  { latitude: 37.7916, longitude: -122.4526 },
  { latitude: 37.7869, longitude: -122.4604 },
];

export const activeRoute = densify(schoolWaypoints);
export const clinicRoute = densify(clinicWaypoints, 10);
export const practiceRoute = densify(practiceWaypoints, 10);

const driver: Driver = {
  id: 'driver-leela',
  name: 'Leela Nair',
  vehicle: 'Velora Shuttle 04',
  plate: 'VL 4821',
  rating: 4.9,
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function createMembers(): FamilyMember[] {
  return [
    {
      id: ARIA_ID,
      name: 'Aria Shah',
      relationship: 'Daughter',
      role: 'passenger',
      phone: '+1 415 555 0172',
      consent: 'granted',
      sharingLocation: true,
    },
    {
      id: NOAH_ID,
      name: 'Noah Shah',
      relationship: 'Son',
      role: 'passenger',
      phone: '+1 415 555 0194',
      consent: 'pending',
      sharingLocation: false,
    },
    {
      id: 'member-meera',
      name: 'Meera Shah',
      relationship: 'You',
      role: 'guardian',
      phone: '+1 415 555 0148',
      consent: 'granted',
      sharingLocation: false,
    },
    {
      id: 'member-dev',
      name: 'Dev Shah',
      relationship: 'Co-guardian',
      role: 'guardian',
      phone: '+1 415 555 0116',
      consent: 'granted',
      sharingLocation: false,
    },
  ];
}

export function createContacts(): EmergencyContact[] {
  return [
    { id: 'contact-dev', name: 'Dev Shah', relationship: 'Co-guardian', phone: '+1 415 555 0116' },
    { id: 'contact-clinic', name: 'Harbor Family Clinic', relationship: 'Clinic', phone: '+1 415 555 0133' },
  ];
}

export function createActiveTrip(): Trip {
  const current = activeRoute[Math.floor(activeRoute.length * 0.22)] ?? activeRoute[0]!;
  return {
    id: ACTIVE_TRIP_ID,
    passengerId: ARIA_ID,
    passengerName: 'Aria Shah',
    relationship: 'Daughter',
    origin: 'Lincoln High',
    destination: 'Home · Harbor District',
    status: 'en_route',
    startedAt: hoursAgo(0.35),
    etaMinutes: 14,
    progress: 0.22,
    route: activeRoute,
    current,
    speedKph: 32,
    heading: 290,
    driver,
    consent: 'granted',
    simulated: true,
    updatedAt: new Date().toISOString(),
  };
}

export function createHistory(): Trip[] {
  return [
    {
      id: 'trip-yesterday',
      passengerId: ARIA_ID,
      passengerName: 'Aria Shah',
      relationship: 'Daughter',
      origin: 'Lincoln High',
      destination: 'Home · Harbor District',
      status: 'arrived',
      startedAt: hoursAgo(26),
      endedAt: hoursAgo(25.4),
      etaMinutes: 0,
      progress: 1,
      route: activeRoute,
      current: activeRoute[activeRoute.length - 1]!,
      speedKph: 0,
      heading: 280,
      driver,
      consent: 'granted',
      simulated: true,
      updatedAt: hoursAgo(25.4),
    },
    {
      id: 'trip-clinic',
      passengerId: ARIA_ID,
      passengerName: 'Aria Shah',
      relationship: 'Daughter',
      origin: 'Home · Harbor District',
      destination: 'Harbor Family Clinic',
      status: 'arrived',
      startedAt: hoursAgo(50),
      endedAt: hoursAgo(49.5),
      etaMinutes: 0,
      progress: 1,
      route: clinicRoute,
      current: clinicRoute[clinicRoute.length - 1]!,
      speedKph: 0,
      heading: 70,
      driver: { ...driver, name: 'Samir Cole', vehicle: 'Family sedan', plate: '7HJK221' },
      consent: 'granted',
      simulated: true,
      updatedAt: hoursAgo(49.5),
    },
    {
      id: 'trip-practice',
      passengerId: NOAH_ID,
      passengerName: 'Noah Shah',
      relationship: 'Son',
      origin: 'Music studio',
      destination: 'Home · Harbor District',
      status: 'arrived',
      startedAt: hoursAgo(74),
      endedAt: hoursAgo(73.3),
      etaMinutes: 0,
      progress: 1,
      route: practiceRoute,
      current: practiceRoute[practiceRoute.length - 1]!,
      speedKph: 0,
      heading: 220,
      driver: { ...driver, name: 'Dev Shah', vehicle: 'Family sedan', plate: '7HJK221' },
      consent: 'granted',
      simulated: true,
      updatedAt: hoursAgo(73.3),
    },
  ];
}

export function createEvidence(): Evidence[] {
  return [
    {
      id: 'evidence-still',
      kind: 'photo',
      uri: '',
      label: 'Simulated cabin still. Not a real recording.',
      simulated: true,
      capturedAt: hoursAgo(49.7),
    },
    {
      id: 'evidence-clip',
      kind: 'video',
      uri: '',
      label: 'Simulated 8-second clip. Not a real recording.',
      simulated: true,
      capturedAt: hoursAgo(49.7),
    },
  ];
}

export function createIncidents(): Incident[] {
  const point = clinicRoute[Math.floor(clinicRoute.length * 0.62)] ?? clinicRoute[0]!;
  return [
    {
      id: 'incident-speed',
      tripId: 'trip-clinic',
      kind: 'speeding',
      severity: 'watch',
      title: 'Speed above the sample limit',
      summary:
        'The sample sedan held 18 km/h over the posted limit for about 40 seconds on the clinic run. The event closed when speed returned to the limit. This record is simulated.',
      occurredAt: hoursAgo(49.7),
      locationLabel: 'Sample arterial · Harbor District',
      coordinate: point,
      evidence: createEvidence(),
      simulated: true,
      status: 'resolved',
    },
  ];
}

export function createAlerts(): SafetyAlert[] {
  return [
    {
      id: 'alert-fatigue',
      tripId: ACTIVE_TRIP_ID,
      kind: 'fatigue',
      severity: 'info',
      title: 'Calm cabin',
      message: 'Simulated fatigue signal is low on Aria’s current sample trip.',
      createdAt: hoursAgo(0.2),
      simulated: true,
    },
    {
      id: 'alert-glance',
      tripId: ACTIVE_TRIP_ID,
      kind: 'distraction',
      severity: 'info',
      title: 'No distraction pattern',
      message: 'Simulated glance detection has not crossed the watch threshold.',
      createdAt: hoursAgo(0.15),
      simulated: true,
    },
    {
      id: 'alert-speed',
      tripId: 'trip-clinic',
      incidentId: 'incident-speed',
      kind: 'speeding',
      severity: 'watch',
      title: 'Speeding on the clinic run',
      message: 'Simulated speed stayed above the sample limit for 40 seconds. Open the incident for the labeled evidence.',
      createdAt: hoursAgo(49.7),
      simulated: true,
    },
  ];
}

export const defaultPrivacy: PrivacySettings = {
  shareWithGuardians: false,
  foregroundSharing: false,
  backgroundSharing: false,
  cameraEvidence: false,
  speechMonitoring: true,
};

export const defaultNotifications: NotificationPrefs = {
  tripStart: true,
  arrival: true,
  speeding: true,
  fatigue: true,
  sos: true,
  pushEnabled: false,
};
