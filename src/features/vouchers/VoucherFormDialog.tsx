import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { extractErrorMessage } from '../../api/client';
import { vouchersApi, type Voucher, type VoucherPayload } from '../../api/vouchers.api';
import { TenantSelector } from '../../components/common/TenantSelector';
import { useScopeStore } from '../../stores/scopeStore';
import { useUIStore } from '../../stores/uiStore';
dayjs.extend(utc);

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
    limitRp: z.number().min(0, 'Min 0'),
    dateFrom: z.string().min(1, 'Tanggal mulai wajib diisi'),
    dateTo: z.string().min(1, 'Tanggal selesai wajib diisi'),
    status: z.enum(['active', 'inactive']),
    tenantId: z.number('Tenant wajib dipilih').min(1, 'Tenant wajib dipilih'),
  })
  .superRefine((d, ctx) => {
    if ((d.value > 0) && (d.limitRp % d.value !== 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total Budget harus bisa dibagi habis oleh Discount Value',
        path: ['limitRp'],
      });
    }
    const today = dayjs.utc().format('YYYY-MM-DD');
    if (d.dateFrom && d.dateFrom < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal mulai tidak boleh sebelum hari ini',
        path: ['dateFrom'],
      });
    }
    if (d.dateFrom && d.dateTo && d.dateTo < d.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal selesai harus >= tanggal mulai',
        path: ['dateTo'],
      });
    }
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
  const { activeTenantId } = useScopeStore()
  const isEditing = !!editTarget;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', value: 0, limitRp: 0, dateFrom: '', dateTo: '', status: 'active', tenantId: activeTenantId ?? undefined },
  });

  useEffect(() => {
    if (open && editTarget) {
      reset({
        code: editTarget.code,
        name: editTarget.name,
        value: editTarget.value,
        limitRp: editTarget.limitRp,
        dateFrom: toInputDate(editTarget.dateFrom),
        dateTo: toInputDate(editTarget.dateTo),
        status: editTarget.status as 'active' | 'inactive',
        tenantId: editTarget.tenantId,
      });
    } else if (open && !editTarget) {
      reset({
        code: '',
        name: '',
        value: 0,
        limitRp: 0,
        dateFrom: '',
        dateTo: '',
        status: 'active',
        tenantId: activeTenantId ?? undefined,
      });
    }
  }, [open, editTarget, reset, activeTenantId]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: VoucherPayload = {
        code: values.code,
        name: values.name,
        value: values.value,
        limitRp: values.limitRp,
        dateFrom: toIso(values.dateFrom),
        dateTo: toIso(values.dateTo),
        status: values.status,
        tenantId: values.tenantId ?? activeTenantId,
      };
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
          {!isEditing &&
            <TenantSelector height='40px' displayNull isSubmitted={!!errors.tenantId} errorMsg={errors.tenantId?.message} />
          }
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
              error={!!errors.limitRp}
              helperText={errors.limitRp?.message}
              slotProps={{ htmlInput: { min: 0 } }}
              {...register('limitRp', { valueAsNumber: true })}
            />
          </Stack>
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              label="Start"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.dateFrom}
              helperText={errors.dateFrom?.message}
              {...register('dateFrom')}
            />
            <TextField
              label="End"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.dateTo}
              helperText={errors.dateTo?.message}
              {...register('dateTo')}
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
