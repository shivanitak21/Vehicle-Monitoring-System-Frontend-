import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Linking, Pressable } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/StateViews';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/lib/errors';
import { contactSchema, type ContactValues } from '@/lib/validation';
import { createEmergencyContact, deleteEmergencyContact, getEmergencyContacts } from '@/services/api/family';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';

export default function ContactsScreen() {
  const queryClient = useQueryClient();
  const isDemo = useAuthStore((state) => state.isDemo);
  const user = useAuthStore((state) => state.user);
  const demoHydrated = useDemoStore((state) => state.hydrated);
  const [formError, setFormError] = useState<string | null>(null);
  const contactsQuery = useQuery({
    queryKey: ['family', 'contacts', isDemo],
    queryFn: getEmergencyContacts,
    enabled: Boolean(user) && (!isDemo || demoHydrated),
  });
  const { control, handleSubmit, reset, formState } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', relationship: '', phone: '' },
  });
  const add = useMutation({
    mutationFn: createEmergencyContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['family', 'contacts'] });
      reset();
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  return (
    <Screen withHeader>
      <DemoBanner />
      <AppText tone="muted">
        These people are contacted only after someone confirms an SOS. Adding a number does not message them.
      </AppText>
      {contactsQuery.isLoading ? <LoadingState label="Loading contacts" /> : null}
      {contactsQuery.isError ? (
        <ErrorState message={getErrorMessage(contactsQuery.error)} onRetry={() => void contactsQuery.refetch()} />
      ) : null}
      {!contactsQuery.isLoading && contactsQuery.data?.length === 0 ? (
        <EmptyState title="No emergency contacts" message="Add someone who should hear about a confirmed SOS." />
      ) : null}
      {contactsQuery.data?.map((contact) => (
        <Card key={contact.id}>
          <AppText variant="title" style={{ fontSize: 18 }}>
            {contact.name}
          </AppText>
          <AppText tone="muted">
            {contact.relationship} · {contact.phone}
          </AppText>
          <Pressable onPress={() => void Linking.openURL(`tel:${contact.phone.replace(/\s/g, '')}`)}>
            <AppText tone="lime">Call</AppText>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(`Remove ${contact.name}?`, 'They will no longer be listed for SOS.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    void deleteEmergencyContact(contact.id).then(() =>
                      queryClient.invalidateQueries({ queryKey: ['family', 'contacts'] }),
                    );
                  },
                },
              ]);
            }}
          >
            <AppText tone="danger">Remove</AppText>
          </Pressable>
        </Card>
      ))}
      <AppText variant="title">Add a contact</AppText>
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
      {formError ? <AppText tone="danger">{formError}</AppText> : null}
      <Button
        label="Save contact"
        loading={add.isPending || formState.isSubmitting}
        onPress={() => void handleSubmit((values) => add.mutate(values))()}
      />
    </Screen>
  );
}
