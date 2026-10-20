import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '@/constants/config';
import { createId } from '@/lib/id';
import {
  createAlerts,
  createContacts,
  createIncidents,
  createMembers,
} from '@/services/demo/fixtures';
import type { EmergencyContact, Evidence, FamilyMember, Incident, SafetyAlert } from '@/types/models';

type DemoState = {
  hydrated: boolean;
  members: FamilyMember[];
  contacts: EmergencyContact[];
  incidents: Incident[];
  alerts: SafetyAlert[];
  setHydrated: (hydrated: boolean) => void;
  addMember: (member: Omit<FamilyMember, 'id' | 'consent' | 'sharingLocation'>) => void;
  removeMember: (id: string) => void;
  setSampleSharing: (id: string, sharing: boolean) => void;
  addContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeContact: (id: string) => void;
  pushAlert: (alert: SafetyAlert) => void;
  acknowledgeAlert: (id: string) => void;
  acknowledgeIncident: (id: string) => void;
  addIncident: (incident: Incident) => void;
  addEvidence: (incidentId: string, evidence: Evidence) => void;
  reset: () => void;
};

const seed = () => ({
  members: createMembers(),
  contacts: createContacts(),
  incidents: createIncidents(),
  alerts: createAlerts(),
});

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      hydrated: false,
      ...seed(),
      setHydrated: (hydrated) => set({ hydrated }),
      addMember: (member) =>
        set((state) => ({
          members: [
            ...state.members,
            { ...member, id: createId('member'), consent: 'pending', sharingLocation: false },
          ],
        })),
      removeMember: (id) =>
        set((state) => ({ members: state.members.filter((member) => member.id !== id) })),
      setSampleSharing: (id, sharing) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? { ...member, sharingLocation: sharing, consent: sharing ? 'granted' : 'revoked' }
              : member,
          ),
        })),
      addContact: (contact) =>
        set((state) => ({
          contacts: [...state.contacts, { ...contact, id: createId('contact') }],
        })),
      removeContact: (id) =>
        set((state) => ({ contacts: state.contacts.filter((contact) => contact.id !== id) })),
      pushAlert: (alert) =>
        set((state) => ({
          alerts: [alert, ...state.alerts.filter((item) => item.id !== alert.id)].slice(0, 24),
        })),
      acknowledgeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((alert) => (alert.id === id ? { ...alert, acknowledged: true } : alert)),
        })),
      acknowledgeIncident: (id) =>
        set((state) => ({
          incidents: state.incidents.map((incident) =>
            incident.id === id ? { ...incident, acknowledged: true } : incident,
          ),
        })),
      addIncident: (incident) =>
        set((state) => ({ incidents: [incident, ...state.incidents] })),
      addEvidence: (incidentId, evidence) =>
        set((state) => ({
          incidents: state.incidents.map((incident) =>
            incident.id === incidentId
              ? { ...incident, evidence: [...incident.evidence, evidence] }
              : incident,
          ),
        })),
      reset: () => set(seed()),
    }),
    {
      name: storageKeys.demo,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        members: state.members,
        contacts: state.contacts,
        incidents: state.incidents,
        alerts: state.alerts,
      }),
    },
  ),
);
