import { useEffect, useRef, useState } from 'react';
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
  Stack,
  Typography,
  IconButton,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, type Product, type ProductPayload } from '../../api/products.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';
import { colors } from '../../theme/colors';
import { useScopeStore } from '../../stores/scopeStore';
import { TenantSelector } from '../../components/common/TenantSelector';
import { usePermissions } from '../../hooks/usePermissions';

const MAX_SIZE_MB = 2;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const schema = z.object({
  productCode: z.string().min(1, 'Kode produk wajib diisi'),
  productName: z.string().min(1, 'Nama produk wajib diisi'),
  tenantId: z.number('Tenant wajib dipilih').min(1, 'Tenant wajib dipilih'),
  productPrice: z.number().min(0, 'Harga tidak boleh negatif'),
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { isSuperAdmin } = usePermissions();
  const { activeTenantId } = useScopeStore()
  const [selectedTenantId, setSelectedTenantId] = useState<number>(activeTenantId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productCode: '', productName: '', productPrice: 0, tenantId: selectedTenantId ?? undefined },
  });

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setFileError('');
      setUploadProgress(null);
      setPreviewUrl(editTarget?.productPhoto || null);
      reset(
        editTarget
          ? {
            productCode: editTarget.productCode,
            productName: editTarget.productName,
            productPrice: editTarget.productPrice,
            tenantId: editTarget.tenantId,
          }
          : { productCode: '', productName: '', productPrice: 0, tenantId: selectedTenantId ?? undefined }
      );
    }
  }, [open, editTarget, reset]);

  // Sync selectedTenantId (dari TenantSelector) ke field tenantId setiap kali berubah
  useEffect(() => {
    if (open && !editTarget) {
      setValue('tenantId', selectedTenantId ?? null);
    }
  }, [selectedTenantId, open, editTarget, setValue]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Format tidak didukung. Gunakan PNG, JPG, atau WebP.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Ukuran file maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }
    setFileError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ProductPayload = {
        productCode: values.productCode,
        productName: values.productName,
        productPrice: values.productPrice,
        tenantId: values.tenantId,
      };
      return isEditing
        ? productsApi.update(editTarget!.id, payload, selectedFile, (pct) => setUploadProgress(pct))
        : productsApi.create(payload, selectedFile, (pct) => setUploadProgress(pct));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSnackbar(isEditing ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      setUploadProgress(null);
      onClose();
    },
    onError: (err) => {
      showSnackbar(extractErrorMessage(err), 'error');
      setUploadProgress(null);
    },
  });

  const photoRequiredError = isSubmitted && !isEditing && !selectedFile;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        hidden
        onChange={handleFileSelect}
      />
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {isEditing ? 'Edit Produk' : 'Tambah Produk'}
          </Typography>
          <IconButton size="small" onClick={onClose} disabled={isSubmitting || mutation.isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box
            component="form"
            id="product-form"
            onSubmit={handleSubmit((v) => {
              if (!isEditing && !selectedFile) return;
              mutation.mutate(v);
            })}
            noValidate
          >
            <Stack sx={{ gap: 2 }}>
              {/* Tenant Selector — hanya untuk superAdmin */}
              {(isSuperAdmin && !isEditing) && (
                <TenantSelector
                  height='40px'
                  displayNull
                  isSubmitted={!!errors.tenantId}
                  errorMsg={errors.tenantId?.message}
                  value={selectedTenantId}
                  onChange={(value) => setSelectedTenantId(value)}
                />
              )}
              <TextField
                label="Kode Produk"
                fullWidth
                size="small"
                error={!!errors.productCode}
                helperText={errors.productCode?.message}
                {...register('productCode')}
              />
              <TextField
                label="Nama Produk"
                fullWidth
                size="small"
                error={!!errors.productName}
                helperText={errors.productName?.message}
                {...register('productName')}
              />
              <TextField
                label="Harga (Rp)"
                type="number"
                fullWidth
                size="small"
                error={!!errors.productPrice}
                helperText={errors.productPrice?.message}
                slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                {...register('productPrice', { valueAsNumber: true })}
              />
              {/* <TextField
                label="Tenant ID"
                type="number"
                fullWidth
                size="small"
                error={!!errors.tenantId}
                helperText={errors.tenantId?.message}
                value={selectedTenantId}
                disabled
                slotProps={{ htmlInput: { min: 1 } }}
                {...register('tenantId', { valueAsNumber: true })}
              /> */}

              {/* ── Foto Produk ── */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.base['black'], mb: 1 }}>
                  Foto Produk
                </Typography>
                {(fileError || photoRequiredError) && (
                  <Typography sx={{ fontSize: 13, color: colors.error[500], mb: 1 }}>
                    {fileError || 'Foto produk wajib diisi'}
                  </Typography>
                )}
                {!previewUrl ? (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 5,
                      gap: 1,
                      cursor: 'pointer',
                      color: colors.base['grey'],
                      border: `2px dashed ${(fileError || photoRequiredError) ? colors.error[500] : colors.border['default']}`,
                      borderRadius: 2,
                      transition: 'border-color 0.15s',
                      '&:hover': { borderColor: (fileError || photoRequiredError) ? colors.error[500] : colors.brand[400] },
                    }}
                  >
                    <AddPhotoAlternateIcon sx={{ fontSize: 36 }} />
                    <Typography sx={{ fontSize: 13 }}>Klik untuk pilih foto produk</Typography>
                    <Typography sx={{ fontSize: 11, color: colors.base['grey'] }}>
                      PNG, JPG, WebP — maks. {MAX_SIZE_MB}MB
                    </Typography>
                  </Box>
                ) : (
                  <Stack sx={{ gap: 1.5, alignItems: 'center' }}>
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 240,
                        objectFit: 'contain',
                        border: `1px solid ${colors.border['light']}`,
                        borderRadius: 2,
                        bgcolor: colors.base['section'],
                      }}
                    />
                    {selectedFile && (
                      <Box sx={{ width: '100%' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                          {selectedFile.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                        {uploadProgress !== null && (
                          <Box sx={{ mt: 1.5 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 6 }} />
                            <Typography sx={{ fontSize: 11, color: colors.base['grey'] }}>
                              {uploadProgress}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                    >
                      Ganti Foto
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={onClose}
            disabled={isSubmitting || mutation.isPending}
            sx={{ textTransform: 'none' }}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="product-form"
            variant="contained"
            disabled={isSubmitting || mutation.isPending}
            sx={{
              bgcolor: colors.brand[500],
              '&:hover': { bgcolor: colors.brand[600] },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
