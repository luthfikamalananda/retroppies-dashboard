import { Box, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Tidak ada data.' }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary',
        gap: 1,
      }}
    >
      <InboxIcon sx={{ fontSize: 48, opacity: 0.4 }} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
}
