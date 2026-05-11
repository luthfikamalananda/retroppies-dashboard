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
    const role = user?.isSuperadmin ? 'superadmin' : 'user';

    /**
     * Check permission — dua mode:
     *  - Exact:    can('products:create')  → true jika permission persis ada
     *  - Resource: can('products')         → true jika ada permission apapun untuk resource 'products'
     *
     * Selalu baca dari getState() agar tidak kena stale closure.
     */

    // const can = useMemo((permission: string) => {
    //     if (!user || !user?.permissions) {
    //         return () => false;
    //     } else {
    //         // return (permission: string): boolean => {
    //         const permissions = useAuthStore.getState().user?.permissions ?? [];
    //         console.log("Checking permission:", permission, "User permissions:", permissions);
    //         if (permission.includes(':')) {
    //             return permissions.includes(permission);
    //         }
    //         return permissions.some((p) => p.split(':')[0] === permission);
    //         // }
    //     }
    // }, [user])

    function can(permission: string): boolean {
        if (permission === '*') {
            return true; // wildcard: punya semua permission
        }
        const permissions = useAuthStore.getState().user?.permissions ?? [];
        console.log("Checking permission:", permission, "User permissions:", permissions);
        if (permission.includes(':')) {
            return permissions.includes(permission);
        }
        return permissions.some((p) => p.split(':')[0] === permission);
    }

    /**
     * Kembalikan semua action yang dimiliki user untuk resource tertentu.
     * Contoh: actions('products') → ['create', 'read', 'update']
     */

    function actions(resource: string): string[] {
        const permissions = useAuthStore.getState().user?.permissions ?? [];
        console.log("Getting actions for resource:", resource, "User permissions:", permissions);
        return permissions
            .filter((p) => p.split(':')[0] === resource)
            .map((p) => p.split(':')[1]);
    }

    return { can, actions, role };
}



