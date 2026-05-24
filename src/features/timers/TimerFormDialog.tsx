import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { extractErrorMessage } from '../../api/client';
import { timersApi, type Rule } from '../../api/timers.api';
import { TenantSelector } from '../../components/common/TenantSelector';
import { useScopeStore } from '../../stores/scopeStore';
import { useUIStore } from '../../stores/uiStore';

const RULE_TYPES = [
    { value: 'QRIS', label: 'Timer QRIS' },
    { value: 'TIMER', label: 'Timer Sesi Foto' },
];

const schema = z.object({
    rulesType: z.string().min(1, 'Tipe rule wajib diisi'),
    value: z.number().min(0, 'Min 0 detik').max(600, 'Maks 600 detik'),
    tenantId: z.number().min(1, 'Tenant wajib dipilih').nullable(),
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
    const { activeTenantId } = useScopeStore();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { rulesType: '', value: 0, tenantId: activeTenantId ?? null },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { rulesType: editTarget.rulesType, value: editTarget.value, tenantId: editTarget.tenantId }
                    : { rulesType: '', value: 0, tenantId: activeTenantId ?? null },
            );
        }
    }, [open, editTarget, reset, activeTenantId]);

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            editTarget
                ? timersApi.update(editTarget.id, { ...values })
                : timersApi.create({ ...values, tenantId: activeTenantId ?? null }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timers'] });
            showSnackbar(editTarget ? 'Rule berhasil diperbarui' : 'Rule berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle >{editTarget ? 'Edit Rule' : 'Tambah Rule'}</DialogTitle>
            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <DialogContent>
                    <Stack sx={{ gap: 2.5 }}>
                        {!editTarget &&
                            <TenantSelector height='40px' />
                        }
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
