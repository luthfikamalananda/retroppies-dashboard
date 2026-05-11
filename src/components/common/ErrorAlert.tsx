import { Alert, Button, Box } from '@mui/material';

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorAlert({
  message = 'Terjadi kesalahan. Silakan coba lagi.',
  onRetry,
}: ErrorAlertProps) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Coba Lagi
            </Button>
          )
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
