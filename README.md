# Velora

Velora is a family passenger-safety app for Android and iOS. Guardians can follow a trip only after a passenger agrees to share it. Location, camera, and notifications stay off until someone turns them on.

The interface is a dark graphite map with lime accents. Demo mode shows a DEMO label and never presents sample movement as live tracking. A missing alert is not treated as a verified safe state.

## Requirements

- Node.js **22.13 or newer**. Node 20 can start the dev server, but Expo prints an unsupported-engine warning.
- npm 10+
- Expo Go from the Play Store. That build is SDK 57, and this project targets SDK 57 so it opens there.
- Android Studio for an Android emulator, or a Mac with Xcode for the iOS simulator

## Setup

```bash
cp .env.example .env
npm install
npx expo start
```

Then press `a` for Android or `i` for iOS. On Windows or Linux, use Expo Go on a phone, or run:

```bash
npm run android
npm run ios
```

`npm run ios` needs macOS. Typecheck and unit tests:

```bash
npm run typecheck
npm test
```

## Environment

| Variable | Where it is used |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | REST base URL, no trailing slash |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO origin for live GPS, trip status, and safety events |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Expo push token registration |
| `GOOGLE_MAPS_API_KEY` | Native build key for Google Maps. Omit it to use Apple Maps on iOS and Expo Go’s Android map |

Do not commit `.env`. No secrets belong in source.

## Demo mode

On the sign-in screen, choose **Continue in demo mode**. That loads a simulated Harbor District trip for Aria Shah:

- The shuttle moves along a sample route.
- Speed, ETA, and a speeding signal update on a timer.
- Noah Shah stays hidden until sample sharing is resumed.
- SOS creates a sample incident and does not contact anyone.
- A **DEMO** label is shown. Sample positions are not described as live.

If a real sign-in fails because the API is down, the home screen offers demo mode as a separate choice. The app does not silently replace a failed live request with sample coordinates.

Reset the sample family from Profile.

## What needs a development build

Expo Go can run the UI, foreground location, local notifications, and maps.

Background location and remote push need a development build:

```bash
npx expo run:android
npx expo run:ios
```

Or `npx eas-cli@latest build --profile development`.

## Permissions

Velora requests a permission only when the matching control is used.

- **Location while open** — Privacy → Share while the app is open
- **Background location** — Privacy → Share while the app is closed. Android shows a persistent notice
- **Notifications** — Notification preferences → Allow notifications
- **Camera, microphone, and photos** — Incident → Capture evidence, and only after camera evidence is enabled in Privacy

Demo mode can request the same permissions so the prompts can be tested, and it does not upload the position.

## Screens

Splash, onboarding, sign-in, and registration lead into four tabs: Home, Activity, Trips, and Family. Profile, privacy, notifications, cabin monitoring, trip details, route replay, and incident evidence open above the tabs.

Location and events carry an explicit provenance label:

- **REAL** — a current report from the safety service or vehicle
- **DEMO** — simulated data
- **STALE** — the last fix is older than 45 seconds, or the link is reconnecting
- **OFFLINE** — the live link is down
- **UNKNOWN** — sharing is off, or the service has not verified the state

The app does not show a trip as safe just because no alert has arrived.

## Backend contract

Send `Authorization: Bearer <token>` on authenticated calls. Errors should look like `{ "message": "What went wrong" }`.

### Auth

- `POST /auth/register` `{ name, email, password, role: "guardian" | "passenger" }` → `{ token, user }`
- `POST /auth/login` `{ email, password }` → `{ token, user }`
- `POST /auth/logout`
- `GET /auth/me` → user

User: `{ id, name, email, role, phone? }`

### Trips

- `GET /trips/active` → trip or `404` when nobody is moving
- `GET /trips/:id` → trip. Include `route` or the app calls the route endpoint
- `GET /trips/:id/route` → `{ coordinates: [{ latitude, longitude }] }`
- `GET /trips/history?cursor=` → `{ items: Trip[], nextCursor: string | null }`

Trip fields: `id`, `passengerId`, `passengerName`, `relationship`, `origin`, `destination`, `status` (`scheduled | en_route | paused | arrived`), `startedAt`, `endedAt?`, `etaMinutes`, `progress` (0–1), `route`, `current`, `speedKph`, `heading`, `driver` `{ id, name, vehicle, plate, rating }`, `consent` (`granted | pending | revoked`), `simulated`, `updatedAt`.

### Location share

`POST /location/share`

```json
{ "latitude": 0, "longitude": 0, "speedKph": 0, "heading": 0, "recordedAt": "ISO-8601" }
```

The phone sends this only after foreground or background sharing is enabled, and never in demo mode.

### Safety

- `GET /safety/score` → `{ score, fatigue, distraction, speeding, sosCount, updatedAt, simulated }`
- `GET /safety/alerts` → `SafetyAlert[]`
- `GET /safety/incidents` → `Incident[]`
- `GET /safety/incidents/:id` → incident
- `POST /safety/sos` `{ tripId }` → incident
- `POST /safety/incidents/:id/evidence` multipart `file` and `kind` (`photo` or `video`) → evidence

Alert: `{ id, tripId, incidentId?, kind, severity, title, message, createdAt, simulated }`

Kinds: `fatigue | distraction | speeding | sos | geofence | harsh_braking | occupancy | abusive_language | device_offline`. Severity: `info | watch | critical`.

- `POST /safety/alerts/:id/acknowledge` marks an alert seen. It does not contact emergency services.
- `POST /safety/incidents/:id/acknowledge` marks an incident seen. It does not contact emergency services.

Optional alert fields the UI can show when the service sends them: `acknowledged`, `source`, `passengerName`, `vehicleLabel`.

Optional evidence fields: `durationSec`, `uploadStatus` (`uploading | uploaded | failed | expired | unavailable`).

`GET /trips/active` may return one trip or an array. A 404 means there is no active trip.

Cabin state arrives on Socket.IO event `cabin:state`. Optional fields: `camera` (`available | unavailable | unknown`), `inference` (`running | idle | unavailable | unknown`), `recording` (`on | off | unknown`), `confidence`, `deviceStatus`. The phone does not open a live video stream and does not invent those values when they are absent.

### Family and profile

- `GET /family/members` and `POST /family/members` `{ name, relationship, phone, role }`
- `DELETE /family/members/:id`
- `GET /family/emergency-contacts` and `POST /family/emergency-contacts` `{ name, relationship, phone }`
- `DELETE /family/emergency-contacts/:id`
- `GET /family/privacy` and `PATCH /family/privacy`
- `PATCH /profile` `{ name, phone? }`
- `GET /profile/notifications` and `PATCH /profile/notifications`
- `POST /devices/push-token` `{ token, platform: "ios" | "android" }`

Privacy: `{ shareWithGuardians, foregroundSharing, backgroundSharing, cameraEvidence, speechMonitoring }`

Notifications: `{ tripStart, arrival, speeding, fatigue, sos, pushEnabled }`

### Socket.IO

Connect to `EXPO_PUBLIC_SOCKET_URL` with `auth: { token }`.

- `trip:location` `{ tripId, latitude, longitude, speedKph, heading, updatedAt }`
- `trip:status` `{ tripId, status, etaMinutes, progress }`
- `safety:event` same shape as a safety alert

When the socket is down, the home screen shows **Link offline**. It does not invent a position.

## What this build does not do

- It does not transcribe audio on the phone. Abusive-language rows appear only when demo mode is on, or when the vehicle or safety service sends that event.
- It does not show a live cabin video. Seat, gaze, camera, inference, and recording lines are whatever `cabin:state` actually contains.
- It does not decide server-side data retention. Privacy explains that limitation.
- Background location and remote push still need a development build and `EXPO_PUBLIC_EAS_PROJECT_ID` for push.
- Acknowledge calls fail with the service error if those two routes are not deployed yet.
