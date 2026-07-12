import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';
import { canAccessPath } from './accessConfig';
import { usePermissions } from '../hooks/usePermissions';
import { useUIStore } from '../stores/uiStore';

// Lazy-load pages so each feature is a separate chunk.
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const TemplatesPage = lazy(() => import('../pages/TemplatesPage'));
const LayoutsPage = lazy(() => import('../pages/LayoutsPage'));
const TimersPage = lazy(() => import('../pages/TimersPage'));
const VouchersPage = lazy(() => import('../pages/VouchersPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage'));
const TenantsPage = lazy(() => import('../pages/TenantsPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const RolesPage = lazy(() => import('../pages/RolesPage'));
const RolePermissionsPage = lazy(() => import('../pages/RolePermissionsPage'));
const PermissionsPage = lazy(() => import('../pages/PermissionsPage'));
const ManagementAccount = lazy(() => import('../pages/ManagementAccount'));
const SessionsPage = lazy(() => import('../pages/SessionsPage'));

function PageLoader() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );
}

// UX-level page guard. Blocks URL-typed navigation to pages the current user
// can't reach (per accessConfig), bouncing them to Dashboard with a toast.
// The backend remains the security boundary (ADR-0002); this is UX only.
function AccessGuard({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const { can, isSuperAdmin } = usePermissions();
    const allowed = canAccessPath(location.pathname, { isSuperAdmin, can });

    useEffect(() => {
        if (!allowed) {
            useUIStore.getState().showSnackbar(
                "You don't have access to that page.",
                'warning',
            );
        }
    }, [allowed, location.pathname]);

    if (!allowed) {
        return <Navigate to="/app/dashboard" replace />;
    }
    return <>{children}</>;
}

export function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected — wrapped in AppShell */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/app/*"
                        element={
                            <AppShell>
                                <Suspense fallback={<PageLoader />}>
                                    <AccessGuard>
                                    <Routes>
                                        <Route path="dashboard" element={<DashboardPage />} />
                                        <Route path="products" element={<ProductsPage />} />
                                        <Route path="layouts" element={<LayoutsPage />} />
                                        <Route path="layouts/:layoutId/templates" element={<TemplatesPage />} />
                                        <Route path="timers" element={<TimersPage />} />
                                        <Route path="vouchers" element={<VouchersPage />} />
                                        <Route path="transactions" element={<TransactionsPage />} />
                                        <Route path="accounts" element={<AccountsPage />} />
                                        <Route path="tenants" element={<TenantsPage />} />
                                        <Route path="users" element={<UsersPage />} />
                                        <Route path="roles" element={<RolesPage />} />
                                        <Route path="roles/:id/permissions" element={<RolePermissionsPage />} />
                                        <Route path="permissions" element={<PermissionsPage />} />
                                        <Route path="manage-account" element={<ManagementAccount />} />
                                        <Route path="sessions" element={<SessionsPage />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
                                    </AccessGuard>
                                </Suspense>
                            </AppShell>
                        }
                    />
                </Route>

                {/* Root redirect */}
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
        </Suspense>
    );
}
