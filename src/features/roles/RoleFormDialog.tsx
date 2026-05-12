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
import { rolesApi, type Role, type RolePayload } from '../../api/roles.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';

const schema = z.object({
    name: z.string().min(1, 'Nama role wajib diisi'),
    description: z.string().min(1, 'Deskripsi wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    editTarget: Role | null;
    onClose: () => void;
}

export function RoleFormDialog({ open, editTarget, onClose }: Props) {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', description: '' },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { name: editTarget.name, description: editTarget.description }
                    : { name: '', description: '' },
            );
        }
    }, [open, editTarget, reset]);

    const mutation = useMutation({
        mutationFn: (values: RolePayload) =>
            editTarget ? rolesApi.update(editTarget.id, values) : rolesApi.create(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showSnackbar(editTarget ? 'Role berhasil diperbarui' : 'Role berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editTarget ? 'Edit Role' : 'Tambah Role'}</DialogTitle>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <DialogContent>
                    <Stack sx={{ gap: 2.5, pt: 0.5 }}>
                        <TextField
                            label="Nama Role"
                            fullWidth
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            {...register('name')}
                        />
                        <TextField
                            label="Deskripsi"
                            fullWidth
                            multiline
                            rows={2}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                            {...register('description')}
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
