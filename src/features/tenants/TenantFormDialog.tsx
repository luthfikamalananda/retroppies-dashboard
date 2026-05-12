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
    Stack,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi, type Tenant, type TenantPayload } from '../../api/tenants.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';

const schema = z.object({
    code: z.string().min(1, 'Kode tenant wajib diisi'),
    name: z.string().min(1, 'Nama tenant wajib diisi'),
    address: z.string().min(1, 'Alamat wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    editTarget: Tenant | null;
    onClose: () => void;
}

export function TenantFormDialog({ open, editTarget, onClose }: Props) {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '', name: '', address: '' },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { code: editTarget.tenant_code, name: editTarget.name, address: editTarget.address }
                    : { code: '', name: '', address: '' },
            );
        }
    }, [open, editTarget, reset]);

    const mutation = useMutation({
        mutationFn: (values: TenantPayload) =>
            editTarget ? tenantsApi.update(editTarget.id, values) : tenantsApi.create(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            showSnackbar(editTarget ? 'Tenant berhasil diperbarui' : 'Tenant berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editTarget ? 'Edit Tenant' : 'Tambah Tenant'}</DialogTitle>
            <form onSubmit={handleSubmit((v) => mutation.mutate({ ...v, tenantCode: v.code }))} noValidate>
                <DialogContent>
                    <Stack sx={{ gap: 2.5, pt: 0.5 }}>
                        <TextField
                            label="Kode Tenant"
                            fullWidth
                            error={!!errors.code}
                            helperText={errors.code?.message}
                            {...register('code')}
                        />
                        <TextField
                            label="Nama Tenant"
                            fullWidth
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            {...register('name')}
                        />
                        <TextField
                            label="Alamat"
                            fullWidth
                            multiline
                            rows={2}
                            error={!!errors.address}
                            helperText={errors.address?.message}
                            {...register('address')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={mutation.isPending}>Batal</Button>
                    <Button type="submit" variant="contained" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
