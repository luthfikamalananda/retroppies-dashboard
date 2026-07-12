import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';


// Redirects to /login if user is not authenticated.
// Shows a full-screen spinner while the auth bootstrap is in progress.
export function ProtectedRoute() {
    const { user } = useAuthStore();
    const clearScope = useAuthStore((s) => s.clearScope);
    const { pathname } = useLocation();
    const isSuperadmin = user?.isSuperadmin ?? false;
    // const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

    // Reset tenant scope to "All Tenants" on every page change, so a tenant
    // picked on one page never carries over to the next.
    // Only superadmins have a selectable scope; a normal user's tenantId is
    // their own tenant and must NOT be zeroed.
    useEffect(() => {
        if (isSuperadmin) clearScope();
    }, [pathname, clearScope, isSuperadmin]);

    // if (isBootstrapping) {
    //     return (
    //         <Box
    //             sx={{
    //                 height: '100vh',
    //                 display: 'flex',
    //                 alignItems: 'center',
    //                 justifyContent: 'center',
    //             }}
    //         >
    //             <CircularProgress />
    //         </Box>
    //     );
    // }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
