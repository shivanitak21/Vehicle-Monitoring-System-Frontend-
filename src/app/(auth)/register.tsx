import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [formError, setFormError] = useState<string | null>(null);
  const { control, handleSubmit, formState, watch, setValue } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'guardian', accepted: false },
  });
  const role = watch('role');
  const accepted = watch('accepted');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      router.replace('/home');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <Screen>
      <AppText variant="label" tone="lime">
        CREATE ACCOUNT
      </AppText>
      <AppText variant="display" style={styles.title}>
        Join a family circle
      </AppText>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            label="NAME"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="words"
            placeholder="Your name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="EMAIL"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@family.com"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            label="PASSWORD"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            placeholder="At least 8 characters"
          />
        )}
      />
      <View style={styles.roles}>
        {(['guardian', 'passenger'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setValue('role', option, { shouldValidate: true })}
            style={[styles.role, role === option && styles.roleOn]}
          >
            <AppText tone={role === option ? 'lime' : 'muted'}>
              {option === 'guardian' ? 'Guardian' : 'Passenger'}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setValue('accepted', !accepted, { shouldValidate: true })} style={styles.consent}>
        <View style={[styles.box, accepted && styles.boxOn]} />
        <AppText tone="muted" style={styles.consentCopy}>
          I understand location sharing, recording, and alerts stay off until I turn them on. Guardians only see trips a passenger approves.
        </AppText>
      </Pressable>
      {formState.errors.accepted ? <AppText tone="danger">{formState.errors.accepted.message}</AppText> : null}
      {formError ? <AppText tone="danger">{formError}</AppText> : null}
      <Button label="Create account" onPress={() => void onSubmit()} loading={formState.isSubmitting} />
      <Link href="/login" style={styles.link}>
        <AppText tone="lime">I already have an account</AppText>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 36, lineHeight: 40 },
  roles: { flexDirection: 'row', gap: 10 },
  role: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  roleOn: { borderColor: colors.lime, backgroundColor: 'rgba(214, 255, 74, 0.08)' },
  consent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.textDim, marginTop: 2 },
  boxOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  consentCopy: { flex: 1 },
  link: { alignSelf: 'center' },
});
