import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Box,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage } from '../api/client';
import { DUMMY_MODE, dummyLogin } from '../mocks/dummyAuth';
import { colors } from '../theme/colors';
import loginPoster from '../assets/login-poster.png';
import { useScopeStore } from '../stores/scopeStore';

const loginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const { setScope } = useScopeStore();

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(values: LoginForm) {
        setServerError('');
        try {
            const data = DUMMY_MODE
                ? await dummyLogin(values.username, values.password)
                : await authApi.login({ username: values.username, password: values.password });
            setUser(data.result);
            setScope(data.result.tenantId);
            navigate('/app/dashboard', { replace: true });
        } catch (err) {
            setServerError(DUMMY_MODE ? (err as Error).message : extractErrorMessage(err));
        }
    }

    return (
        <Box
            sx={{
                maxHeight: '100dvh',
                minHeight: '100dvh',
                display: 'flex',
                bgcolor: colors.base['white'],
            }}
        >
            {/* ── Left panel: poster image ───────────────────────────── */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    width: '40%',
                    p: 3,
                    flexShrink: 0,

                }}
            >
                {/* Placeholder — ganti src dengan gambar poster Retroppies */}
                <Box
                    sx={{
                        width: 'max-content',
                        borderRadius: "24px",
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100%',
                    }}
                >
                    <img src={loginPoster} alt="Retroppies Poster" style={{ width: 'max-content', height: '100%', objectFit: 'fill' }} />
                </Box>
            </Box>

            {/* ── Right panel: form ──────────────────────────────────── */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 3, sm: 6, md: 8 },
                    py: 6,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 600
                    }}>
                    {/* Title */}
                    <Typography
                        variant="titleLg"
                        component="h1"
                        sx={{ color: colors.base['black'], mb: 4 }}
                    >
                        Log In to Your Business Account
                    </Typography>

                    {/* Dummy mode hint */}
                    {DUMMY_MODE && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <strong>Demo mode</strong><br />
                            admin@retroppies.com / admin123<br />
                            manager@retroppies.com / manager123
                        </Alert>
                    )}

                    {/* Server error */}
                    {serverError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {serverError}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box
                        component="form"
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                    >
                        {/* Username */}
                        <Box>
                            <Typography
                                variant="bodySm"
                                component="label"
                                htmlFor="login-username"
                                sx={{ color: colors.base['black'], fontWeight: 500, display: 'block', mb: 0.75 }}
                            >
                                Username
                            </Typography>
                            <TextField
                                id="login-username"
                                type="username"
                                fullWidth
                                autoComplete="username"
                                placeholder="Input your username"
                                error={!!errors.username}
                                helperText={errors.username?.message}
                                size="medium"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: colors.base['white'],
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: colors.border['default'] },
                                        '&:hover fieldset': { borderColor: colors.border['hover'] },
                                        '&.Mui-focused fieldset': { borderColor: colors.brand[500] },
                                    },
                                    '& input::placeholder': { color: colors.base['grey'], opacity: 1 },
                                }}
                                {...register('username')}
                            />
                        </Box>

                        {/* Password */}
                        <Box>
                            <Typography
                                variant="bodySm"
                                component="label"
                                htmlFor="login-password"
                                sx={{ color: colors.base['black'], fontWeight: 500, display: 'block', mb: 0.75 }}
                            >
                                Password
                            </Typography>
                            <TextField
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                autoComplete="current-password"
                                placeholder="Input your password"
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                size="medium"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: colors.base['white'],
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: colors.border['default'] },
                                        '&:hover fieldset': { borderColor: colors.border['hover'] },
                                    },
                                    '& input::placeholder': { color: colors.base['grey'], opacity: 1 },
                                }}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword((v) => !v)}
                                                    size="small"
                                                    edge="end"
                                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                                >
                                                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                {...register('password')}
                            />
                        </Box>

                        {/* Submit */}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                mt: 1,
                                py: 1.5,
                                borderRadius: 2,
                                fontSize: '16px',
                                fontWeight: 600,
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                '&.Mui-disabled': {
                                    bgcolor: colors.brand[200],
                                    color: colors.base['white'],
                                },
                            }}
                        >
                            {isSubmitting ? 'Masuk...' : 'Log In'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
