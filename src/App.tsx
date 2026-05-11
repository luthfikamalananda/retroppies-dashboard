import { useEffect, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme/theme';
import { AppRoutes } from './routes/AppRoutes';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Menangani event auth:logout yang di-dispatch oleh API interceptor saat 401.
// Harus di dalam BrowserRouter agar bisa akses useNavigate.
function AuthLogoutHandler() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleLogout(e: Event) {
      const msg = (e as CustomEvent<{ message: string }>).detail?.message
        ?? 'Sesi Anda telah berakhir. Silakan login kembali.';
      queryClient.clear();
      setMessage(msg);
      navigate('/login', { replace: true });
    }

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  return (
    <Snackbar
      open={!!message}
      autoHideDuration={4000}
      onClose={() => setMessage('')}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity="warning" onClose={() => setMessage('')} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <AuthLogoutHandler />
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
