import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { colors } from '../../theme/colors';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 18, color: colors.base['black'], fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14, color: colors.base['black'] }}>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, width: '100%', display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          fullWidth
          sx={{
            border: `1px solid ${colors.brand[500]}`,
            color: colors.brand[500],
            '&:hover': {
              border: `1px solid ${colors.brand[600]}`,
              color: colors.brand[600]
            },
            height: 40
          }}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ bgcolor: colors.brand[500], '&:hover': { bgcolor: colors.brand[600] }, height: 40 }}
          disabled={loading}
          fullWidth
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
