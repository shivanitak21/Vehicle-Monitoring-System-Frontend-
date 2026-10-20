import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { initials } from '@/lib/format';
import { profileSchema, type ProfileValues } from '@/lib/validation';
import { updateProfile } from '@/services/api/profile';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import { useLiveStore } from '@/stores/live-store';
import { usePreferencesStore } from '@/stores/preferences-store';
import { queryClient } from '@/lib/query-client';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);
  const logout = useAuthStore((state) => state.logout);
  const resetDemo = useDemoStore((state) => state.reset);
  const connection = useLiveStore((state) => state.connection);
  const cabin = useLiveStore((state) => state.cabin);
  const privacy = usePreferencesStore((state) => state.privacy);
  const [message, setMessage] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });
  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => setMessage(isDemo ? 'Sample profile updated on this device.' : 'Profile saved.'),
    onError: (error) => setMessage(getErrorMessage(error)),
  });

  if (!user) return null;

  return (
    <Screen>
      <ScreenHeader title="Profile" detail="Account, notifications, privacy, and the health of the link to the vehicle." />
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <AppText variant="title" tone="lime">
            {initials(user.name)}
          </AppText>
        </View>
        <View style={styles.copy}>
          <AppText variant="title">{user.name}</AppText>
          <AppText tone="muted">{user.email}</AppText>
          <AppText variant="caption" tone="dim">
            {user.role === 'guardian' ? 'Guardian' : 'Passenger'}
            {isDemo ? ' · Demo persona' : ''}
          </AppText>
        </View>
      </View>
      <Card>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField label="NAME" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <TextField
              label="PHONE"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="phone-pad"
            />
          )}
        />
        {message ? <AppText tone="muted">{message}</AppText> : null}
        <Button
          label="Save profile"
          loading={save.isPending || formState.isSubmitting}
          onPress={() => {
            setMessage(null);
            void handleSubmit((values) => save.mutate({ name: values.name, phone: values.phone || undefined }))();
          }}
        />
      </Card>
      <Card>
        <AppText variant="label" tone="muted">
          DEVICE HEALTH
        </AppText>
        <AppText tone="muted">Link {isDemo ? 'demo' : connection}. Location sharing {privacy.foregroundSharing ? 'on' : 'off'}.</AppText>
        <AppText tone="muted">
          {cabin?.deviceStatus
            ? cabin.deviceStatus
            : cabin
              ? `Cabin report ${cabin.simulated ? 'is simulated' : 'was received'}.`
              : 'No vehicle status has been reported.'}
        </AppText>
        <Button label="Open cabin monitor" variant="secondary" onPress={() => router.push('/cabin')} />
      </Card>
      <Button label="Notification preferences" variant="secondary" onPress={() => router.push('/notifications')} />
      <Button label="Privacy and location" variant="secondary" onPress={() => router.push('/privacy')} />
      <Button label="Emergency contacts" variant="ghost" onPress={() => router.push('/contacts')} />
      {isDemo ? (
        <Button
          label="Reset sample data"
          variant="ghost"
          onPress={() => {
            resetDemo();
            void queryClient.invalidateQueries();
            setMessage('Sample family, alerts, and incidents were reset.');
          }}
        />
      ) : null}
      <Button
        label="Sign out"
        variant="danger"
        onPress={() => {
          void logout().then(() => router.replace('/login'));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
});
