import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;       // mobile overlay open
  sidebarCollapsed: boolean;  // desktop icon-only mode
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen:      false,
  sidebarCollapsed: false,
  setSidebarOpen:   (open) => set({ sidebarOpen: open }),
  toggleSidebar:    () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCollapsed:  () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
