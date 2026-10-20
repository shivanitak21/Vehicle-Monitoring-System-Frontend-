import { Redirect, Tabs } from 'expo-router';
import { TabIcon } from '@/components/ui/TabIcon';
import { MAIN_TABS } from '@/constants/navigation';
import { colors, fonts } from '@/constants/theme';
import { useDemoSimulator } from '@/hooks/use-demo-simulator';
import { useRealtime } from '@/hooks/use-realtime';
import { useAuthStore } from '@/stores/auth-store';

export default function MainLayout() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  useDemoSimulator();
  useRealtime();

  if (!hydrated) return null;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemibold, fontSize: 11 },
      }}
    >
      {MAIN_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => <TabIcon name={tab.icon} color={color} size={size} />,
          }}
        />
      ))}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
