import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const enterDemo = useAuthStore((state) => state.enterDemo);
  const [formError, setFormError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const { control, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.replace('/home');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  const onDemo = async () => {
    setDemoLoading(true);
    setFormError(null);
    try {
      await enterDemo();
      router.replace('/home');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Screen>
      <AppText variant="label" tone="lime">
        WELCOME BACK
      </AppText>
      <AppText variant="display" style={styles.title}>
        Sign in to your family
      </AppText>
      <AppText tone="muted">Guardians see trips a passenger has agreed to share. Passengers control that sharing.</AppText>
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
      {formError ? <AppText tone="danger">{formError}</AppText> : null}
      <Button label="Sign in" onPress={() => void onSubmit()} loading={formState.isSubmitting} />
      <Link href="/register" style={styles.link}>
        <AppText tone="lime">Create an account</AppText>
      </Link>
      <View style={styles.demo}>
        <AppText variant="title" style={styles.demoTitle}>
          Demo mode
        </AppText>
        <AppText tone="muted">
          Opens a simulated Harbor District trip for Aria Shah. The map moves, alerts fire, and nothing is live tracking.
        </AppText>
        <Button label="Continue in demo mode" variant="secondary" onPress={() => void onDemo()} loading={demoLoading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 36, lineHeight: 40 },
  link: { alignSelf: 'center' },
  demo: {
    marginTop: 8,
    padding: 16,
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: 'rgba(214, 255, 74, 0.04)',
  },
  demoTitle: { fontSize: 18 },
});
