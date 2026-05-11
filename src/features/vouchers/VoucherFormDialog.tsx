import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  MenuItem,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vouchersApi, type Voucher, type VoucherPayload } from '../../api/vouchers.api';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { extractErrorMessage } from '../../api/client';

/** Convert YYYY-MM-DD (from date input) to UTC ISO string for API */
function toIso(dateStr: string) {
  return dayjs.utc(dateStr).toISOString();
}

/** Convert UTC ISO string from server to YYYY-MM-DD for date input */
function toInputDate(isoString: string) {
  return dayjs.utc(isoString).format('YYYY-MM-DD');
}

const schema = z
  .object({
    code: z.string().min(1, 'Kode voucher wajib diisi'),
    name: z.string().min(1, 'Judul voucher wajib diisi'),
    value: z.number().min(0, 'Min 0'),
    limit_rp: z.number().min(0, 'Min 0'),
    date_from: z.string().min(1, 'Tanggal mulai wajib diisi'),
    date_to: z.string().min(1, 'Tanggal selesai wajib diisi'),
    status: z.enum(['active', 'inactive']),
  })
  .superRefine((d, ctx) => {
    if ((d.value > 0) && (d.limit_rp % d.value !== 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total Budget harus bisa dibagi habis oleh Discount Value',
        path: ['limit_rp'],
      });
    }
    const today = dayjs.utc().format('YYYY-MM-DD');
    if (d.date_from && d.date_from < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal mulai tidak boleh sebelum hari ini',
        path: ['date_from'],
      });
    }
    if (d.date_from && d.date_to && d.date_to < d.date_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai harus >= tanggal mulai',
        path: ['date_to'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  code: '',
  name: '',
  value: 0,
  limit_rp: 0,
  date_from: '',
  date_to: '',
  status: 'active',
};

interface VoucherFormDialogProps {
  open: boolean;
  editTarget: Voucher | null;
  onClose: () => void;
}

export function VoucherFormDialog({ open, editTarget, onClose }: VoucherFormDialogProps) {
  const queryClient = useQueryClient();
  const showSnackbar = useUIStore((s) => s.showSnackbar);
  const { user } = useAuthStore();
  const isEditing = !!editTarget;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open && editTarget) {
      reset({
        code: editTarget.code,
        name: editTarget.name,
        value: editTarget.value,
        limit_rp: editTarget.limit_rp,
        date_from: toInputDate(editTarget.date_from),
        date_to: toInputDate(editTarget.date_to),
        status: editTarget.status as 'active' | 'inactive',
      });
    } else if (open && !editTarget) {
      reset(EMPTY_VALUES);
    }
  }, [open, editTarget, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: VoucherPayload = {
        ...values,
        date_from: toIso(values.date_from),
        date_to: toIso(values.date_to),
        tenant_id: user?.tenantId ?? 0,
      };
      console.log('Payload to submit:', payload); // Debug log
      // dummy return
      // return new Promise((resolve) => {
      //   setTimeout(() => {
      //     resolve({
      //       id: editTarget?.id ?? Math.floor(Math.random() * 1000),
      //       ...payload,
      //       CreatedAt: new Date().toISOString(),
      //       CreatedBy: 'unknown',
      //       UpdatedAt: new Date().toISOString(),
      //       UpdatedBy: 'unknown',
      //     } as Voucher);
      //   }, 1000);
      // });
      return isEditing
        ? vouchersApi.update(editTarget!.id, payload)
        : vouchersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      showSnackbar(isEditing ? 'Voucher berhasil diperbarui' : 'Voucher berhasil ditambahkan');
      onClose();
    },
    onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Voucher' : 'Tambah Voucher'}</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="voucher-form"
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          noValidate
        >
          <TextField
            label="Voucher Code"
            fullWidth
            // disabled={isEditing}
            error={!!errors.code}
            helperText={errors.code?.message}
            {...register('code')}
          />
          <TextField
            label="Promo Title"
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register('name')}
          />
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              label="Discount Value (Rp)"
              type="number"
              fullWidth
              error={!!errors.value}
              helperText={errors.value?.message}
              slotProps={{ htmlInput: { min: 0 } }}
              {...register('value', { valueAsNumber: true })}
            />
            <TextField
              label="Total Budget (Rp)"
              type="number"
              fullWidth
              error={!!errors.limit_rp}
              helperText={errors.limit_rp?.message}
              slotProps={{ htmlInput: { min: 0 } }}
              {...register('limit_rp', { valueAsNumber: true })}
            />
          </Stack>
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              label="Start"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.date_from}
              helperText={errors.date_from?.message}
              {...register('date_from')}
            />
            <TextField
              label="End"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.date_to}
              helperText={errors.date_to?.message}
              {...register('date_to')}
            />
          </Stack>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField select label="Status" fullWidth {...field}>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="inactive">Nonaktif</MenuItem>
              </TextField>
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Batal
        </Button>
        <Button
          type="submit"
          form="voucher-form"
          variant="contained"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
