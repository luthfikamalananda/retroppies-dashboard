import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { extractErrorMessage } from '../../api/client';

const schema = z
  .object({
    voucher_code: z.string().min(1, 'Kode voucher wajib diisi'),
    voucher_title: z.string().min(1, 'Judul voucher wajib diisi'),
    discount: z
      .number()
      .min(0, 'Min 0')
      .max(100, 'Maks 100'),
    product_type: z.string().min(1, 'Tipe produk wajib diisi'),
    period_start: z.string().min(1, 'Tanggal mulai wajib diisi'),
    period_end: z.string().min(1, 'Tanggal selesai wajib diisi'),
    usage_limit: z.number().min(0, 'Min 0'),
    status: z.enum(['active', 'inactive']),
  })
  .refine((d) => d.period_end >= d.period_start, {
    message: 'Tanggal selesai harus >= tanggal mulai',
    path: ['period_end'],
  });

type FormValues = z.infer<typeof schema>;

interface VoucherFormDialogProps {
  open: boolean;
  editTarget: Voucher | null;
  onClose: () => void;
}

export function VoucherFormDialog({ open, editTarget, onClose }: VoucherFormDialogProps) {
  const queryClient = useQueryClient();
  const showSnackbar = useUIStore((s) => s.showSnackbar);
  const isEditing = !!editTarget;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      voucher_code: '',
      voucher_title: '',
      discount: 0,
      product_type: '',
      period_start: '',
      period_end: '',
      usage_limit: 0,
      status: 'active',
    },
  });

  useEffect(() => {
    if (open && editTarget) {
      reset({
        voucher_code: editTarget.voucher_code,
        voucher_title: editTarget.voucher_title,
        discount: editTarget.discount,
        product_type: editTarget.product_type,
        period_start: editTarget.period_start,
        period_end: editTarget.period_end,
        usage_limit: editTarget.usage_limit,
        status: editTarget.status,
      });
    } else if (open && !editTarget) {
      reset({
        voucher_code: '',
        voucher_title: '',
        discount: 0,
        product_type: '',
        period_start: '',
        period_end: '',
        usage_limit: 0,
        status: 'active',
      });
    }
  }, [open, editTarget, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: VoucherPayload = values;
      return isEditing
        ? vouchersApi.update(editTarget!.voucher_code, payload)
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
            label="Kode Voucher"
            fullWidth
            disabled={isEditing}
            error={!!errors.voucher_code}
            helperText={errors.voucher_code?.message}
            {...register('voucher_code')}
          />
          <TextField
            label="Judul Voucher"
            fullWidth
            error={!!errors.voucher_title}
            helperText={errors.voucher_title?.message}
            {...register('voucher_title')}
          />
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              label="Diskon (%)"
              type="number"
              fullWidth
              error={!!errors.discount}
              helperText={errors.discount?.message}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              {...register('discount', { valueAsNumber: true })}
            />
            <TextField
              label="Tipe Produk"
              fullWidth
              error={!!errors.product_type}
              helperText={errors.product_type?.message}
              {...register('product_type')}
            />
          </Stack>
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              label="Mulai"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.period_start}
              helperText={errors.period_start?.message}
              {...register('period_start')}
            />
            <TextField
              label="Berakhir"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.period_end}
              helperText={errors.period_end?.message}
              {...register('period_end')}
            />
          </Stack>
          <TextField
            label="Batas Pemakaian"
            type="number"
            fullWidth
            error={!!errors.usage_limit}
            helperText={errors.usage_limit?.message}
            slotProps={{ htmlInput: { min: 0 } }}
            {...register('usage_limit', { valueAsNumber: true })}
          />
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
