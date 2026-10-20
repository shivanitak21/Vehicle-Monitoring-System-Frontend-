import type { ConfigContext, ExpoConfig } from 'expo/config';

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    'expo-router',
    'expo-image',
    'expo-font',
    'expo-secure-store',
    'expo-video',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#070B12',
        image: './assets/splash-icon.png',
        imageWidth: 160,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Velora uses this phone’s location only after you turn sharing on, so people you approve can follow your trip.',
        locationAlwaysAndWhenInUsePermission:
          'Velora keeps sharing this phone’s location while a trip is active, only if you allow background sharing in Privacy.',
        locationAlwaysPermission:
          'Velora keeps sharing this phone’s location while a trip is active, only if you allow background sharing in Privacy.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#D6FF4A',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Velora attaches a photo you choose to an incident report.',
        cameraPermission: 'Velora uses the camera only when you choose to capture incident evidence.',
        microphonePermission:
          'Velora uses the microphone only when you choose to record a short incident video.',
      },
    ],
  ];

  if (mapsKey) {
    plugins.push([
      'react-native-maps',
      {
        iosGoogleMapsApiKey: mapsKey,
        androidGoogleMapsApiKey: mapsKey,
      },
    ]);
  }

  return {
    ...config,
    name: 'Velora',
    slug: 'velora',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'velora',
    userInterfaceStyle: 'dark',
    icon: './assets/icon.png',
    backgroundColor: '#070B12',
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.velora.safety',
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ['location'],
      },
    },
    android: {
      ...config.android,
      package: 'com.velora.safety',
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: '#070B12',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      ...config.web,
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins,
    experiments: {
      typedRoutes: false,
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      },
    },
  };
};
