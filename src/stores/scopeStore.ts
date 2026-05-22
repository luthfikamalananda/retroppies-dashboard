// Scope store — tracks which tenant/outlet is currently active.
// Used as part of TanStack Query keys so switching scope refetches everything.
import { create } from 'zustand';

interface ScopeState {
  activeTenantId: number | null;
  setScope: (tenantId: number) => void;
  clearScope: () => void;
}

export const useScopeStore = create<ScopeState>((set) => ({
  activeTenantId: null,
  setScope: (tenantId) => set({ activeTenantId: tenantId }),
  clearScope: () => set({ activeTenantId: null }),
}));
