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
import { timersApi, type Rule } from '../../api/timers.api';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { extractErrorMessage } from '../../api/client';

const RULE_TYPES = [
    { value: 'Qris', label: 'Timer QRIS' },
    { value: 'Timer', label: 'Timer Sesi Foto' },
];

const schema = z.object({
    rulesType: z.string().min(1, 'Tipe rule wajib diisi'),
    value: z.number().min(0, 'Min 0 detik').max(600, 'Maks 600 detik'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    editTarget: Rule | null;
    onClose: () => void;
}

export function TimerFormDialog({ open, editTarget, onClose }: Props) {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const { user } = useAuthStore();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { rulesType: '', value: 0 },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { rulesType: editTarget.rulesType, value: editTarget.value }
                    : { rulesType: '', value: 0 },
            );
        }
    }, [open, editTarget, reset]);

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            editTarget
                ? timersApi.update(editTarget.id, { ...values })
                : timersApi.create({ ...values, tenantId: user?.tenantId ?? 0 }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timers'] });
            showSnackbar(editTarget ? 'Rule berhasil diperbarui' : 'Rule berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editTarget ? 'Edit Rule' : 'Tambah Rule'}</DialogTitle>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <DialogContent>
                    <Stack sx={{ gap: 2.5, pt: 0.5 }}>
                        <Controller
                            name="rulesType"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Tipe Rule"
                                    fullWidth
                                    disabled={!!editTarget}
                                    error={!!errors.rulesType}
                                    helperText={errors.rulesType?.message}
                                >
                                    {RULE_TYPES.map((rt) => (
                                        <MenuItem key={rt.value} value={rt.value}>
                                            {rt.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        <TextField
                            label="Nilai (detik)"
                            type="number"
                            fullWidth
                            error={!!errors.value}
                            helperText={errors.value?.message ?? 'Durasi dalam detik (0–600)'}
                            slotProps={{ htmlInput: { min: 0, max: 600 } }}
                            {...register('value', { valueAsNumber: true })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={mutation.isPending}>
                        Batal
                    </Button>
                    <Button type="submit" variant="contained" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
