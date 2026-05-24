// Shared permission helper.
// UI uses this to decide whether to show/hide menu items or action buttons.
// Security is always enforced by the backend — this is UX only.
//
// Permissions come directly from LoginResponse.permissions (backend-authoritative).
// isSuperadmin is used as a display-only role label fallback.
import { useAuthStore } from '../stores/authStore';

export function usePermissions() {
    // Subscribe untuk reactivity (komponen re-render saat user berubah)
    const user = useAuthStore((s) => s.user);
    const isSuperAdmin = Boolean(user?.isSuperadmin) ? true : false;

    /**
     * Check permission — dua mode:
     *  - Exact:    can('products:create')  → true jika permission persis ada
     *  - Resource: can('products')         → true jika ada permission apapun untuk resource 'products'
     *
     * Selalu baca dari getState() agar tidak kena stale closure.
     */

    function can(permission: string): boolean {
        if (isSuperAdmin === true) {
            return true;
        }
        if (permission === '*') {
            return true; // wildcard: punya semua permission
        }
        const permissions = useAuthStore.getState().user?.permissions ?? [];
        if (permission.includes(':')) {
            return permissions.includes(permission);
        }
        return permissions.some((p) => p.split(':')[0] === permission);
    }

    return { can, isSuperAdmin };
}



