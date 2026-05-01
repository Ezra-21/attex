import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../src/store/uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false, sidebarCollapsed: false });
  });

  it('starts closed and expanded', () => {
    const s = useUIStore.getState();
    expect(s.sidebarOpen).toBe(false);
    expect(s.sidebarCollapsed).toBe(false);
  });

  it('setSidebarOpen sets the value directly', () => {
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('toggleSidebar flips the mobile overlay', () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('toggleCollapsed flips the desktop rail without touching the overlay', () => {
    useUIStore.getState().toggleCollapsed();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleCollapsed();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it('keeps the two flags independent', () => {
    useUIStore.getState().setSidebarOpen(true);
    useUIStore.getState().toggleCollapsed();
    const s = useUIStore.getState();
    expect(s.sidebarOpen).toBe(true);
    expect(s.sidebarCollapsed).toBe(true);
  });
});
