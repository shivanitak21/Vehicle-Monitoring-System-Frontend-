import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextField } from '@/components/ui/TextField';
import { colors, radius } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors';
import { memberSchema, type MemberValues } from '@/lib/validation';
import { createMember, deleteMember, getMembers } from '@/services/api/family';
import { ARIA_ID } from '@/services/demo/fixtures';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import type { FamilyMember } from '@/types/models';

export default function FamilyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const setSampleSharing = useDemoStore((state) => state.setSampleSharing);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const membersQuery = useQuery({
    queryKey: ['family', 'members', isDemo],
    queryFn: getMembers,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
  });
  const { control, handleSubmit, reset, formState } = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '', relationship: '', phone: '', role: 'guardian' },
  });
  const addMutation = useMutation({
    mutationFn: createMember,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'members'] });
      reset();
      setOpen(false);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const remove = (member: FamilyMember) => {
    Alert.alert(`Revoke access for ${member.name}?`, 'They will leave this circle and stop seeing shared trips. This does not delete their account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke access',
        style: 'destructive',
        onPress: () => {
          void deleteMember(member.id).then(() => queryClient.invalidateQueries({ queryKey: ['family', 'members'] }));
        },
      },
    ]);
  };

  const members = membersQuery.data ?? [];
  const passengers = members.filter((member) => member.role === 'passenger');
  const guardians = members.filter((member) => member.role !== 'passenger');

  return (
    <Screen>
      <ScreenHeader
        title="Family"
        detail="Passengers and guardians are listed separately. Pending consent shows no location, and revoking access stops sharing."
      />
      {membersQuery.isLoading ? <LoadingState label="Loading your circle" /> : null}
      {membersQuery.isError ? (
        <ErrorState message={getErrorMessage(membersQuery.error)} onRetry={() => void membersQuery.refetch()} />
      ) : null}
      <Section
        title="Passengers"
        people={passengers}
        onRemove={remove}
        isDemo={isDemo}
        onSample={(id, sharing) => {
          setSampleSharing(id, sharing);
          void queryClient.invalidateQueries({ queryKey: ['family'] });
          void queryClient.invalidateQueries({ queryKey: ['trips'] });
        }}
        sampleId={ARIA_ID}
      />
      <Section title="Guardians" people={guardians} onRemove={remove} isDemo={isDemo} />
      <View style={styles.links}>
        <Button label="Emergency contacts" variant="secondary" onPress={() => router.push('/contacts')} />
        <Button label="Privacy and sharing" variant="secondary" onPress={() => router.push('/privacy')} />
        <Button label="Profile and settings" variant="ghost" onPress={() => router.push('/profile')} />
      </View>
      <Button label={open ? 'Close form' : 'Invite someone'} variant="secondary" onPress={() => setOpen((value) => !value)} />
      {open ? (
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
            name="relationship"
            render={({ field, fieldState }) => (
              <TextField
                label="RELATIONSHIP"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Aunt, co-guardian"
              />
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
          <RolePicker controlRole={control} />
          {formError ? <AppText tone="danger">{formError}</AppText> : null}
          <Button
            label="Send invitation"
            loading={addMutation.isPending || formState.isSubmitting}
            onPress={() => {
              setFormError(null);
              void handleSubmit((values) => addMutation.mutate(values))();
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function RolePicker({ controlRole }: { controlRole: ReturnType<typeof useForm<MemberValues>>['control'] }) {
  return (
    <Controller
      control={controlRole}
      name="role"
      render={({ field }) => (
        <View style={styles.roles}>
          {(['guardian', 'passenger', 'driver'] as const).map((role) => (
            <Pressable key={role} onPress={() => field.onChange(role)} style={[styles.role, field.value === role && styles.roleOn]}>
              <AppText variant="caption" tone={field.value === role ? 'lime' : 'muted'}>
                {role}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    />
  );
}

function Section({
  title,
  people,
  onRemove,
  isDemo,
  onSample,
  sampleId,
}: {
  title: string;
  people: FamilyMember[];
  onRemove: (member: FamilyMember) => void;
  isDemo: boolean;
  onSample?: (id: string, sharing: boolean) => void;
  sampleId?: string;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="title">{title}</AppText>
      {people.length === 0 ? <AppText tone="muted">No one here yet.</AppText> : null}
      {people.map((member) => (
        <Card key={member.id}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <AppText variant="title" style={styles.name}>
                {member.name}
              </AppText>
              <AppText tone="muted">
                {member.relationship} · {member.phone}
              </AppText>
            </View>
            <StatusPill
              label={
                member.sharingLocation && member.consent === 'granted'
                  ? 'Sharing'
                  : member.consent === 'pending'
                    ? 'Consent pending'
                    : member.consent === 'revoked'
                      ? 'Access revoked'
                      : 'Not sharing'
              }
              tone={member.sharingLocation && member.consent === 'granted' ? 'info' : member.consent === 'pending' ? 'watch' : 'critical'}
            />
          </View>
          {isDemo && member.id === sampleId && onSample ? (
            <Button
              label={member.sharingLocation ? 'Pause sample sharing' : 'Resume sample sharing'}
              variant="ghost"
              onPress={() => onSample(member.id, !member.sharingLocation)}
            />
          ) : null}
          {isDemo && member.id === sampleId ? (
            <AppText variant="caption" tone="dim">
              This switch changes the sample passenger only. It does not affect a real phone.
            </AppText>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => onRemove(member)}>
            <AppText tone="danger">Revoke access</AppText>
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 34, lineHeight: 38 },
  section: { gap: 10 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flex: { flex: 1, gap: 4 },
  name: { fontSize: 18 },
  links: { gap: 10 },
  roles: { flexDirection: 'row', gap: 8 },
  role: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOn: { borderColor: colors.lime },
});
