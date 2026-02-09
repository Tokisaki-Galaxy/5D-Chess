import { create } from "zustand";

interface SettingsStore {
  theme: "light" | "dark";
  soundEnabled: boolean;
  showMoveHints: boolean;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleMoveHints: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: "dark",
  soundEnabled: true,
  showMoveHints: true,
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleMoveHints: () => set((s) => ({ showMoveHints: !s.showMoveHints })),
}));
