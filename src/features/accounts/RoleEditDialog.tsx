import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Typography,
} from '@mui/material';
import type { Account } from '../../api/accounts.api';

const ROLES = ['admin', 'outlet_manager'];

interface RoleEditDialogProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onSave: (role: string) => void;
  loading: boolean;
}

export function RoleEditDialog({
  open,
  account,
  onClose,
  onSave,
  loading,
}: RoleEditDialogProps) {
  const [role, setRole] = useState('');

  useEffect(() => {
    if (account) setRole(account.role);
  }, [account]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Ubah Role</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Akun: <strong>{account?.name}</strong> ({account?.email})
        </Typography>
        <TextField
          select
          label="Role"
          fullWidth
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>
              {r}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Batal
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(role)}
          disabled={loading || !role || role === account?.role}
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
