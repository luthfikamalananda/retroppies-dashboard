import { Snackbar, Alert } from '@mui/material';
import { useUIStore } from '../../stores/uiStore';

// Global toast — mounted once in AppShell, triggered via useUIStore.showSnackbar()
export function GlobalSnackbar() {
  const snackbar = useUIStore((s) => s.snackbar);
  const hideSnackbar = useUIStore((s) => s.hideSnackbar);

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={hideSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
