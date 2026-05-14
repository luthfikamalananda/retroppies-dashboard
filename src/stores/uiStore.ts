// UI store — sidebar collapsed state, snackbar, etc.
import { create } from 'zustand';

interface SnackbarConfig {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
    sidebarCollapsed: boolean;
    sidebarMobileOpen: boolean;
    snackbar: SnackbarConfig;
    toggleSidebar: () => void;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    showSnackbar: (message: string, severity?: SnackbarConfig['severity']) => void;
    hideSnackbar: () => void;
}

const defaultSnackbar: SnackbarConfig = {
    open: false,
    message: '',
    severity: 'success',
};

export const useUIStore = create<UIState>((set) => ({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    snackbar: defaultSnackbar,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    openMobileSidebar: () => set({ sidebarMobileOpen: true }),
    closeMobileSidebar: () => set({ sidebarMobileOpen: false }),
    showSnackbar: (message, severity = 'success') =>
        set({ snackbar: { open: true, message, severity } }),
    hideSnackbar: () =>
        set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
}));
