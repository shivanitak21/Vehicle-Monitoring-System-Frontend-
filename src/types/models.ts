export type Role = 'guardian' | 'passenger';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type TripStatus = 'scheduled' | 'en_route' | 'paused' | 'arrived';

export type ConsentState = 'granted' | 'pending' | 'revoked';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  role: 'passenger' | 'guardian' | 'driver';
  phone: string;
  consent: ConsentState;
  sharingLocation: boolean;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
};

export type Driver = {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
};

export type Trip = {
  id: string;
  passengerId: string;
  passengerName: string;
  relationship: string;
  origin: string;
  destination: string;
  status: TripStatus;
  startedAt: string;
  endedAt?: string;
  etaMinutes: number;
  progress: number;
  route: LatLng[];
  current: LatLng;
  speedKph: number;
  heading: number;
  driver: Driver;
  consent: ConsentState;
  simulated: boolean;
  updatedAt: string;
};

export type SafetyKind =
  | 'fatigue'
  | 'distraction'
  | 'speeding'
  | 'sos'
  | 'geofence'
  | 'harsh_braking'
  | 'occupancy'
  | 'abusive_language';

export type Severity = 'info' | 'watch' | 'critical';

export type SafetyAlert = {
  id: string;
  tripId: string;
  incidentId?: string;
  kind: SafetyKind;
  severity: Severity;
  title: string;
  message: string;
  createdAt: string;
  simulated: boolean;
};

export type Evidence = {
  id: string;
  kind: 'photo' | 'video';
  uri: string;
  label: string;
  simulated: boolean;
  capturedAt: string;
};

export type Incident = {
  id: string;
  tripId: string;
  kind: SafetyKind;
  severity: Severity;
  title: string;
  summary: string;
  occurredAt: string;
  locationLabel: string;
  coordinate: LatLng;
  evidence: Evidence[];
  simulated: boolean;
  status: 'open' | 'resolved';
};

export type RiskSnapshot = {
  score: number;
  fatigue: number;
  distraction: number;
  speeding: number;
  sosCount: number;
  updatedAt: string;
  simulated: boolean;
};

export type NotificationPrefs = {
  tripStart: boolean;
  arrival: boolean;
  speeding: boolean;
  fatigue: boolean;
  sos: boolean;
  pushEnabled: boolean;
};

export type PrivacySettings = {
  shareWithGuardians: boolean;
  foregroundSharing: boolean;
  backgroundSharing: boolean;
  cameraEvidence: boolean;
  speechMonitoring: boolean;
};

export type LiveFix = {
  tripId: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  heading: number;
  updatedAt: string;
  source: 'socket' | 'demo' | 'device';
};

export type LiveStatus = {
  tripId: string;
  status: TripStatus;
  etaMinutes: number;
  progress: number;
};

export type ConnectionState = 'idle' | 'connecting' | 'live' | 'demo' | 'offline';

export type DriverGaze = 'forward' | 'glance' | 'drowsy';

export type CabinSeat = {
  id: string;
  label: string;
  occupant: string | null;
  role: 'driver' | 'passenger' | 'empty';
};

export type CabinMonitor = {
  tripId: string;
  simulated: boolean;
  updatedAt: string;
  seatCount: number;
  driverName: string;
  passengerName: string;
  gaze: DriverGaze;
  gazeLabel: string;
  seats: CabinSeat[];
  vlm: {
    status: 'idle' | 'checking' | 'confirmed';
    note: string;
  };
};

export type GuardianNotice = {
  reason: string;
  at: string;
  simulated: boolean;
};

export type CabinCapture = {
  id: string;
  kind: 'photo' | 'video';
  uri: string;
  label: string;
  simulated: boolean;
  capturedAt: string;
  durationSec?: number;
};

export type HistoryPage = {
  items: Trip[];
  nextCursor: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
};
