import { create } from 'zustand';
import type { CabinCapture, CabinMonitor, ConnectionState, GuardianNotice, LiveFix, LiveStatus, SafetyAlert } from '@/types/models';

type LiveState = {
  fix: LiveFix | null;
  status: LiveStatus | null;
  events: SafetyAlert[];
  cabin: CabinMonitor | null;
  captures: CabinCapture[];
  guardianNotice: GuardianNotice | null;
  connection: ConnectionState;
  applyFix: (fix: LiveFix) => void;
  applyStatus: (status: LiveStatus) => void;
  pushEvent: (event: SafetyAlert) => void;
  applyCabin: (cabin: CabinMonitor) => void;
  addCapture: (capture: CabinCapture) => void;
  setCabinCheck: (status: CabinMonitor['vlm']['status'], note: string) => void;
  publishGuardian: (notice: GuardianNotice) => void;
  setConnection: (connection: ConnectionState) => void;
  reset: () => void;
};

export const useLiveStore = create<LiveState>((set) => ({
  fix: null,
  status: null,
  events: [],
  cabin: null,
  captures: [],
  guardianNotice: null,
  connection: 'idle',
  applyFix: (fix) => set({ fix }),
  applyStatus: (status) => set({ status }),
  pushEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 8) })),
  applyCabin: (cabin) =>
    set((state) => ({
      cabin: {
        ...cabin,
        vlm: state.cabin && state.cabin.vlm.status !== 'idle' ? state.cabin.vlm : cabin.vlm,
      },
    })),
  addCapture: (capture) => set((state) => ({ captures: [capture, ...state.captures].slice(0, 8) })),
  setCabinCheck: (status, note) =>
    set((state) => ({
      cabin: state.cabin ? { ...state.cabin, vlm: { status, note } } : state.cabin,
    })),
  publishGuardian: (notice) => set({ guardianNotice: notice }),
  setConnection: (connection) => set({ connection }),
  reset: () => set({ fix: null, status: null, events: [], cabin: null, captures: [], guardianNotice: null, connection: 'idle' }),
}));
