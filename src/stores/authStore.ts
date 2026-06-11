// Auth store — token disimpan di sessionStorage (survive tab reload, hapus saat tab tutup).
// sessionStorage tidak bisa diakses lintas tab, lebih aman dari localStorage.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ResultLogin } from '../api/auth.api';

// Re-export for convenience so other modules don't need to import from api/
export type { ResultLogin as AuthUser };

interface AuthState {
    user: ResultLogin | null;
    setUser: (response: ResultLogin) => void;
    setScope: (tenantId: number) => void; // Optional, hanya untuk TenantSelector
    clearScope: () => void; // Optional, hanya untuk TenantSelector
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            setUser: (response) => set({ user: response }),
            setScope: (tenantId) => set({ user: { ...get().user!, tenantId } }), // Hanya update tenantId di user
            clearScope: () => set({ user: get().user ? { ...get().user!, tenantId: 0 } : null }), // Reset tenantId ke 0 (ALL) atau null jika user belum ada
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'auth',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
