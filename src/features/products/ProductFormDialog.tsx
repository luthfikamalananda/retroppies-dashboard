import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, type Product } from '../../api/products.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';

const schema = z.object({
  product_code: z.string().min(1, 'Kode produk wajib diisi'),
  product_name: z.string().min(1, 'Nama produk wajib diisi'),
  price: z
    .number()
    .min(0, 'Harga tidak boleh negatif'),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormDialogProps {
  open: boolean;
  editTarget: Product | null;
  onClose: () => void;
}

export function ProductFormDialog({ open, editTarget, onClose }: ProductFormDialogProps) {
  const queryClient = useQueryClient();
  const showSnackbar = useUIStore((s) => s.showSnackbar);
  const isEditing = !!editTarget;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { product_code: '', product_name: '', price: 0 },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      reset(
        editTarget
          ? {
              product_code: editTarget.product_code,
              product_name: editTarget.product_name,
              price: editTarget.price,
            }
          : { product_code: '', product_name: '', price: 0 }
      );
    }
  }, [open, editTarget, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEditing
        ? productsApi.update(editTarget!.product_code, values)
        : productsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSnackbar(isEditing ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      onClose();
    },
    onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="product-form"
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          noValidate
        >
          <TextField
            label="Kode Produk"
            fullWidth
            error={!!errors.product_code}
            helperText={errors.product_code?.message}
            disabled={isEditing} // code is immutable after creation
            {...register('product_code')}
          />
          <TextField
            label="Nama Produk"
            fullWidth
            error={!!errors.product_name}
            helperText={errors.product_name?.message}
            {...register('product_name')}
          />
          <TextField
            label="Harga (Rp)"
            type="number"
            fullWidth
            error={!!errors.price}
            helperText={errors.price?.message}
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            {...register('price', { valueAsNumber: true })}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting || mutation.isPending}>
          Batal
        </Button>
        <Button
          type="submit"
          form="product-form"
          variant="contained"
          disabled={isSubmitting || mutation.isPending}
        >
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
