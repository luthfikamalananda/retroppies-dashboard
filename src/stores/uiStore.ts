// UI store — sidebar collapsed state, snackbar, etc.
import { create } from 'zustand';

interface SnackbarConfig {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
    sidebarCollapsed: boolean;
    snackbar: SnackbarConfig;
    toggleSidebar: () => void;
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
    snackbar: defaultSnackbar,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    showSnackbar: (message, severity = 'success') =>
        set({ snackbar: { open: true, message, severity } }),
    hideSnackbar: () =>
        set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
}));
