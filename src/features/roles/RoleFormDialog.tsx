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
import { rolesApi, type RolePayload } from '../../api/roles.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';

const schema = z.object({
    name: z.string().min(1, 'Nama role wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
}

export function RoleFormDialog({ open, onClose }: Props) {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '' },
    });


    const mutation = useMutation({
        mutationFn: (values: RolePayload) =>
            rolesApi.create(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showSnackbar('Role berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Tambah Role</DialogTitle>
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
