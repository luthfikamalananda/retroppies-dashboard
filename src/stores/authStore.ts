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
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (response) => set({ user: response }),
            clearUser: () => set({ user: null }),
        }),
        {
            name: 'auth',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
