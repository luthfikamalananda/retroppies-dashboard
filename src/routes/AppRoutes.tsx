import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/layout/AppShell';

// Lazy-load pages so each feature is a separate chunk.
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const TemplatesPage = lazy(() => import('../pages/TemplatesPage'));
const TimersPage = lazy(() => import('../pages/TimersPage'));
const VouchersPage = lazy(() => import('../pages/VouchersPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage'));

function PageLoader() {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
        </Box>
    );
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
                                    <Routes>
                                        <Route path="dashboard" element={<DashboardPage />} />
                                        <Route path="products" element={<ProductsPage />} />
                                        <Route path="templates" element={<TemplatesPage />} />
                                        <Route path="timers" element={<TimersPage />} />
                                        <Route path="vouchers" element={<VouchersPage />} />
                                        <Route path="transactions" element={<TransactionsPage />} />
                                        <Route path="accounts" element={<AccountsPage />} />
                                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                                    </Routes>
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
