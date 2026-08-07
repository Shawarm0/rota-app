import { create } from "zustand";
import type { Theme } from "../lib/themes";

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const savedTheme = (localStorage.getItem("rota-theme") as Theme) || "classic";

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: savedTheme,
  setTheme: (theme) => {
    localStorage.setItem("rota-theme", theme);
    set({ theme });
  },
}));
