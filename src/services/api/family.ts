import { toApiError } from '@/lib/errors';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useDemoStore } from '@/stores/demo-store';
import type { EmergencyContact, FamilyMember } from '@/types/models';

export async function getMembers(): Promise<FamilyMember[]> {
  if (useAuthStore.getState().isDemo) return useDemoStore.getState().members;
  try {
    const response = await api.get<FamilyMember[]>('/family/members');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createMember(input: {
  name: string;
  relationship: string;
  phone: string;
  role: FamilyMember['role'];
}): Promise<void> {
  if (useAuthStore.getState().isDemo) {
    useDemoStore.getState().addMember(input);
    return;
  }
  try {
    await api.post('/family/members', input);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteMember(id: string): Promise<void> {
  if (useAuthStore.getState().isDemo) {
    useDemoStore.getState().removeMember(id);
    return;
  }
  try {
    await api.delete(`/family/members/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  if (useAuthStore.getState().isDemo) return useDemoStore.getState().contacts;
  try {
    const response = await api.get<EmergencyContact[]>('/family/emergency-contacts');
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createEmergencyContact(input: Omit<EmergencyContact, 'id'>): Promise<void> {
  if (useAuthStore.getState().isDemo) {
    useDemoStore.getState().addContact(input);
    return;
  }
  try {
    await api.post('/family/emergency-contacts', input);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  if (useAuthStore.getState().isDemo) {
    useDemoStore.getState().removeContact(id);
    return;
  }
  try {
    await api.delete(`/family/emergency-contacts/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
}
