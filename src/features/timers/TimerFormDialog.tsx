import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { extractErrorMessage } from '../../api/client';
import { timersApi, type Rule } from '../../api/timers.api';
import { TenantSelector } from '../../components/common/TenantSelector';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const RULE_TYPES = [
    { value: 'QRIS', label: 'Timer QRIS' },
    { value: 'PHOTO', label: 'Timer Sesi Foto' },
];

/** Mapping rulesType → display label (untuk card header di edit mode) */
const RULE_TYPE_DISPLAY: Record<string, string> = {
    QRIS: 'Timer Pembayaran',
    PHOTO: 'Timer Sesi Foto',
    payment_timer: 'Timer Pembayaran',
    photo_session_timer: 'Timer Sesi Foto',
};

const MAX_SECONDS = 600;

const schema = z.object({
    rulesType: z.string().min(1, 'Tipe rule wajib diisi'),
    value: z.number().min(0, 'Min 0 detik').max(MAX_SECONDS, `Maks ${MAX_SECONDS} detik`),
    tenantId: z.number().min(1, 'Tenant wajib dipilih'),
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
    const activeTenantId = useAuthStore().user?.tenantId ?? 0;
    const [selectedTenantId, setSelectedTenantId] = useState<number>(activeTenantId);

    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { rulesType: '', value: 0, tenantId: activeTenantId ?? 0 },
    });

    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { rulesType: editTarget.rulesType, value: editTarget.value, tenantId: editTarget.tenantId }
                    : { rulesType: '', value: 0, tenantId: selectedTenantId ?? 0 },
            );
        }
    }, [open, editTarget, reset, selectedTenantId]);

    // Derive minutes/seconds from total seconds for the visual picker
    const totalSeconds = watch('value') ?? 0;
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    // Label for the card header — edit mode uses editTarget, create mode uses watched value
    const watchedRulesType = watch('rulesType');
    const rulesTypeName = editTarget
        ? (RULE_TYPE_DISPLAY[editTarget.rulesType] ?? editTarget.rulesType)
        : (RULE_TYPE_DISPLAY[watchedRulesType] ?? '');

    /** Adjust total seconds by delta, clamped to [0, MAX_SECONDS] */
    function adjust(delta: number) {
        setValue('value', Math.min(MAX_SECONDS, Math.max(0, totalSeconds + delta)), { shouldValidate: true });
    }

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            editTarget
                ? timersApi.update(editTarget.id, { rulesType: values.rulesType, value: values.value })
                : timersApi.create({ ...values, tenantId: selectedTenantId ?? 0 }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timers'] });
            showSnackbar(editTarget ? 'Rule berhasil diperbarui' : 'Rule berhasil ditambahkan');
            onClose();
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: colors.base['black'] }}>
                    {editTarget ? 'Edit Time Rule' : 'Add Rule'}
                </Typography>
                <IconButton size="small" onClick={onClose} disabled={mutation.isPending} sx={{ color: colors.base['grey'] }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <DialogContent sx={{ pt: 1 }}>
                    <Stack sx={{ gap: 2.5 }}>
                        {/* TenantSelector — create mode only; hidden for non-superadmin via selector itself */}
                        {!editTarget && (
                            <TenantSelector
                                height="40px"
                                displayNull
                                isSubmitted={!!errors.tenantId}
                                errorMsg={errors.tenantId?.message}
                                value={selectedTenantId}
                                onChange={(value) => value && setSelectedTenantId(value)}
                            />
                        )}

                        {/* Rule type selector — create mode only */}
                        {!editTarget && (
                            <Controller
                                name="rulesType"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Timer Type"
                                        fullWidth
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
                        )}

                        {/* Time picker card */}
                        <Box
                            sx={{
                                border: `1px solid ${colors.border['default']}`,
                                borderRadius: 3,
                                p: 2.5,
                            }}
                        >
                            {rulesTypeName && (
                                <Typography sx={{ fontWeight: 700, fontSize: 15, color: colors.base['black'], mb: 2.5 }}>
                                    {rulesTypeName}
                                </Typography>
                            )}

                            {/* Inner time display — centered */}
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        px: 4,
                                        py: 2,
                                        borderRadius: 3,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: colors.base['white'],
                                    }}
                                >
                                    {/* Minutes column */}
                                    <Stack sx={{ alignItems: 'center', gap: 0.25 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => adjust(60)}
                                            disabled={totalSeconds >= MAX_SECONDS}
                                            sx={{ color: colors.base['black'] }}
                                        >
                                            <KeyboardArrowUpIcon />
                                        </IconButton>
                                        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                                            <Typography sx={{ fontSize: 34, fontWeight: 500, color: colors.base['black'], lineHeight: 1.1 }}>
                                                {String(minutes).padStart(2, '0')}
                                            </Typography>
                                            {/* <Typography sx={{ fontSize: 13, color: colors.base['grey'] }}>
                                                min
                                            </Typography> */}
                                        </Stack>
                                        <IconButton
                                            size="small"
                                            onClick={() => adjust(-60)}
                                            disabled={totalSeconds < 60}
                                            sx={{ color: colors.base['black'] }}
                                        >
                                            <KeyboardArrowDownIcon />
                                        </IconButton>
                                    </Stack>

                                    <Typography sx={{ fontSize: 13, color: colors.base['grey'] }}>
                                        min
                                    </Typography>

                                    {/* Colon separator */}
                                    <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.base['black'], pb: 1 }}>
                                        :
                                    </Typography>

                                    {/* Seconds column */}
                                    <Stack sx={{ alignItems: 'center', gap: 0.25 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => adjust(1)}
                                            disabled={totalSeconds >= MAX_SECONDS}
                                            sx={{ color: colors.base['black'] }}
                                        >
                                            <KeyboardArrowUpIcon />
                                        </IconButton>
                                        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                                            <Typography sx={{ fontSize: 34, fontWeight: 500, color: colors.base['black'], lineHeight: 1.1 }}>
                                                {String(secs).padStart(2, '0')}
                                            </Typography>
                                            {/* <Typography sx={{ fontSize: 13, color: colors.base['grey'] }}>
                                                sec
                                            </Typography> */}
                                        </Stack>
                                        <IconButton
                                            size="small"
                                            onClick={() => adjust(-1)}
                                            disabled={totalSeconds <= 0}
                                            sx={{ color: colors.base['black'] }}
                                        >
                                            <KeyboardArrowDownIcon />
                                        </IconButton>
                                    </Stack>

                                    <Typography sx={{ fontSize: 13, color: colors.base['grey'] }}>
                                        sec
                                    </Typography>
                                </Paper>
                            </Box>

                            {/* Validation error for value */}
                            {errors.value && (
                                <Typography sx={{ fontSize: 12, color: colors.error[500], mt: 1.5, textAlign: 'center' }}>
                                    {errors.value.message}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        disabled={mutation.isPending}
                        sx={{
                            borderColor: colors.brand[500],
                            color: colors.brand[500],
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { borderColor: colors.brand[700], color: colors.brand[700], bgcolor: colors.brand[100] },
                        }}
                    >
                        Discard
                    </Button>
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={mutation.isPending}
                        sx={{
                            bgcolor: colors.brand[500],
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: colors.brand[700] },
                        }}
                    >
                        {mutation.isPending ? 'Menyimpan...' : 'Save'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
