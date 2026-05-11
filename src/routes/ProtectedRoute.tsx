import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';


// Redirects to /login if user is not authenticated.
// Shows a full-screen spinner while the auth bootstrap is in progress.
export function ProtectedRoute() {
    const { user } = useAuthStore();
    // const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

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
