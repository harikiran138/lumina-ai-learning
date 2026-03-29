import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SnapshotMap = Record<string, Record<string, any>>;

interface OnboardingState {
  snapshots: SnapshotMap;
  saveSnapshot: (role: string, snapshot: Record<string, any>) => void;
  clearSnapshot: (role?: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      snapshots: {},
      saveSnapshot: (role, snapshot) =>
        set((state) => ({
          snapshots: {
            ...state.snapshots,
            [role]: snapshot,
          },
        })),
      clearSnapshot: (role) =>
        set((state) => {
          if (!role) {
            return { snapshots: {} };
          }

          const next = { ...state.snapshots };
          delete next[role];
          return { snapshots: next };
        }),
    }),
    {
      name: "lumina-onboarding-drafts",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
