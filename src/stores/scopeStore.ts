// Scope store — tracks which tenant/outlet is currently active.
// Used as part of TanStack Query keys so switching scope refetches everything.
import { create } from 'zustand';

interface ScopeState {
  activeTenantId: number | null;
  activeOutletId: string | null;
  setScope: (tenantId: number, outletId?: string) => void;
  clearScope: () => void;
}

export const useScopeStore = create<ScopeState>((set) => ({
  activeTenantId: null,
  activeOutletId: null,
  setScope: (tenantId, outletId) =>
    set({ activeTenantId: tenantId, activeOutletId: outletId ?? null }),
  clearScope: () => set({ activeTenantId: null, activeOutletId: null }),
}));
