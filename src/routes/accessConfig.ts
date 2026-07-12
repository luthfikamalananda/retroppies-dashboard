// Single source of truth for page-level access.
//
// Consumed by:
//   - the route guard (AccessGuard in AppRoutes) — blocks URL-typed navigation
//   - the Sidebar — hides nav items the user can't reach
//   - docs/access-matrix.md — the human-readable mirror of this table
//
// Security is enforced by the backend (see docs/adr/0002-backend-authoritative-rbac.md).
// This is UX-level gating only. See docs/adr/0006-page-access-model.md for the model.

export type AccessRule =
    | { kind: 'public' } // every authenticated user (baseline)
    | { kind: 'permission'; permission: string } // franchise-grantable via a role permission
    | { kind: 'superadmin' }; // structurally Superadmin-only (not grantable)

export interface AccessEntry {
    /**
     * Route path under /app. Matching is by longest prefix, so child routes
     * (e.g. /app/layouts/:id/templates) inherit their parent's rule unless
     * they are listed explicitly.
     */
    path: string;
    access: AccessRule;
}

const publicAccess: AccessRule = { kind: 'public' };
const superadmin: AccessRule = { kind: 'superadmin' };
const perm = (permission: string): AccessRule => ({ kind: 'permission', permission });

export const ACCESS_CONFIG: AccessEntry[] = [
    // Baseline — every authenticated user, no permission required.
    { path: '/app/dashboard', access: publicAccess },
    { path: '/app/manage-account', access: publicAccess },

    // Operational — franchise-grantable via role permissions.
    { path: '/app/products', access: perm('products:read') },
    { path: '/app/layouts', access: perm('templates:read') }, // covers /layouts/:id/templates
    { path: '/app/timers', access: perm('rules:read') },
    { path: '/app/vouchers', access: perm('vouchers:read') },
    { path: '/app/sessions', access: perm('sessions:read') },
    { path: '/app/transactions', access: perm('transactions:read') },

    // Superadmin-only — cross-tenant / account governance. Never grantable.
    { path: '/app/tenants', access: superadmin },
    { path: '/app/users', access: superadmin },
    { path: '/app/roles', access: superadmin }, // covers /roles/:id/permissions
    { path: '/app/permissions', access: superadmin }, // hidden from nav (see Sidebar)
    { path: '/app/accounts', access: superadmin }, // legacy page, hidden from nav
];

export interface AccessContext {
    isSuperAdmin: boolean;
    can: (permission: string) => boolean;
}

/** Resolve the access rule for a pathname via longest-prefix match. */
export function resolveAccess(pathname: string): AccessRule | undefined {
    return ACCESS_CONFIG.filter(
        (e) => pathname === e.path || pathname.startsWith(e.path + '/'),
    ).sort((a, b) => b.path.length - a.path.length)[0]?.access;
}

/**
 * UX-level access decision for a page path.
 *
 * Unknown paths default to allowed — they fall through to the route catch-all
 * (a genuine 404-style redirect), so we don't want to fire a "no access" toast
 * for a mistyped URL.
 */
export function canAccessPath(pathname: string, ctx: AccessContext): boolean {
    const rule = resolveAccess(pathname);
    if (!rule) return true;
    switch (rule.kind) {
        case 'public':
            return true;
        case 'superadmin':
            return ctx.isSuperAdmin;
        case 'permission':
            return ctx.isSuperAdmin || ctx.can(rule.permission);
    }
}
