import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Box,
    Breadcrumbs,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authApi } from '../api/auth.api';
import { extractErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { colors } from '../theme/colors';

const changePasswordSchema = z
    .object({
        oldPassword: z.string().min(1, 'Password lama wajib diisi'),
        newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
        confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Password tidak cocok dengan password baru',
        path: ['confirmPassword'],
    });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ManagementAccount() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

    const mutation = useMutation({
        mutationFn: (values: ChangePasswordForm) =>
            authApi.changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.confirmPassword,
            }),
        onSuccess: () => {
            showSnackbar('Password berhasil diubah');
            handleClose();
        },
        onError: (err) => {
            showSnackbar(extractErrorMessage(err) ?? 'Terjadi kesalahan', 'error');
        },
    });

    function handleClose() {
        reset();
        setShowNew(false);
        setShowConfirm(false);
        setDialogOpen(false);
    }

    return (
        <Box>
            {/* Breadcrumb */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['black'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                <Typography sx={{ color: colors.brand[500], fontSize: 14, fontWeight: 600 }}>
                    Manage Account
                </Typography>
            </Breadcrumbs>

            {/* Main Paper */}
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${colors.border['default']}`,
                    boxShadow: 'none',
                    maxWidth: 640,
                }}
            >
                {/* Header */}
                <Stack direction="row" sx={{ alignItems: 'center', mb: 3 }}>
                    <IconButton
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{ mr: 1, color: colors.base['black'] }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: 20, color: colors.base['black'] }}>
                        Profile Information
                    </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Profile info — read-only */}
                <Stack
                    direction="row"
                    sx={{
                        alignItems: 'center',
                        gap: 1.5,
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: colors.base['background-light'],
                        mb: 3,
                        border: `1px solid ${colors.border['light']}`,
                    }}
                >
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: colors.brand[100],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <PersonOutlineIcon sx={{ color: colors.brand[500], fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: 11, color: colors.base['grey'], mb: 0.25, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Username
                        </Typography>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.base['black'] }}>
                            {user?.username ?? '—'}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Security section */}
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: colors.base['black'], mb: 2 }}>
                        Security
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<LockOutlinedIcon />}
                        onClick={() => setDialogOpen(true)}
                        sx={{
                            borderColor: colors.brand[500],
                            color: colors.brand[500],
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            '&:hover': {
                                borderColor: colors.brand[700],
                                color: colors.brand[700],
                                bgcolor: colors.brand[100],
                            },
                        }}
                    >
                        Change Password
                    </Button>
                </Box>
            </Paper>

            {/* Change Password Dialog */}
            <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="xs">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: colors.base['black'] }}>
                        Change Password
                    </Typography>
                    <IconButton onClick={handleClose} size="small" sx={{ color: colors.base['grey'] }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    {/* {submitError && (
                        <Typography sx={{ color: colors.error[500], fontSize: 13, mb: 2 }}>
                            {submitError}
                        </Typography>
                    )} */}

                    {/* Old Password */}
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.base['black'], mb: 0.75, mt: 1 }}>
                        Old Password
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Input Old Password"
                        type={showOld ? 'text' : 'password'}
                        {...register('oldPassword')}
                        error={!!errors.oldPassword}
                        helperText={errors.oldPassword?.message}
                        sx={{ mb: 2 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowOld((v) => !v)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: colors.base['grey'] }}
                                        >
                                            {showOld ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {/* New Password */}
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.base['black'], mb: 0.75, mt: 1 }}>
                        New Password
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Input New Password"
                        type={showNew ? 'text' : 'password'}
                        {...register('newPassword')}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword?.message}
                        sx={{ mb: 2.5 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowNew((v) => !v)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: colors.base['grey'] }}
                                        >
                                            {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {/* Confirm Password */}
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: colors.base['black'], mb: 0.75 }}>
                        New Password Confirmation
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Input New Password Confirmation"
                        type={showConfirm ? 'text' : 'password'}
                        {...register('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowConfirm((v) => !v)}
                                            edge="end"
                                            size="small"
                                            sx={{ color: colors.base['grey'] }}
                                        >
                                            {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleClose}
                        sx={{
                            borderColor: colors.brand[500],
                            color: colors.brand[500],
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Discard
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit((v) => mutation.mutate(v))}
                        disabled={mutation.isPending}
                        sx={{
                            bgcolor: colors.brand[500],
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: colors.brand[700] },
                        }}
                    >
                        {mutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}