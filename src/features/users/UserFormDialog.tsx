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
    MenuItem,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type User } from '../../api/users.api';
import { useUIStore } from '../../stores/uiStore';
import { extractErrorMessage } from '../../api/client';

const ROLES = ['admin', 'outlet_manager'];

const schema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().optional(),
    role: z.string().min(1, 'Role wajib dipilih'),
    tenant_id: z.number().min(1, 'Tenant wajib dipilih'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    editTarget: User | null;
    onClose: () => void;
}

export function UserFormDialog({ open, editTarget, onClose }: Props) {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { username: '', email: '', password: '', role: '', tenant_id: 0 },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { username: editTarget.username, email: '', role: editTarget.role_name, tenant_id: editTarget.tenant_id, password: '' }
                    : { username: '', email: '', password: '', role: '', tenant_id: 0 },
            );
        }
    }, [open, editTarget, reset]);

    const mutation = useMutation({
        mutationFn: (values: FormValues) => {
            if (editTarget) {
                const { password: _p, ...rest } = values;
                return usersApi.update(editTarget.id, rest);
            }
            return usersApi.create(values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSnackbar(editTarget ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editTarget ? 'Edit User' : 'Tambah User'}</DialogTitle>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <DialogContent>
                    <Stack sx={{ gap: 2.5, pt: 0.5 }}>
                        <TextField
                            label="Username"
                            fullWidth
                            error={!!errors.username}
                            helperText={errors.username?.message}
                            {...register('username')}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            {...register('email')}
                        />
                        {!editTarget && (
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                {...register('password')}
                            />
                        )}
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Role"
                                    fullWidth
                                    error={!!errors.role}
                                    helperText={errors.role?.message}
                                >
                                    {ROLES.map((r) => (
                                        <MenuItem key={r} value={r}>{r}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        <TextField
                            label="Tenant ID"
                            type="number"
                            fullWidth
                            error={!!errors.tenant_id}
                            helperText={errors.tenant_id?.message}
                            slotProps={{ htmlInput: { min: 1 } }}
                            {...register('tenant_id', { valueAsNumber: true })}
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
