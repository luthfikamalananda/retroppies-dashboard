import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    Card,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
    Breadcrumbs,
    Link,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { NavLink } from 'react-router-dom';
import { templatesApi, type ResultTemplate } from '../api/templates.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';

const MAX_FILE_SIZE_MB = 10;

// Skeleton card dimensi sesuai desain
function SkeletonCard() {
    return (
        <Card sx={{ display: 'flex', borderRadius: 2, border: `1px solid ${colors.border['light']}`, boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ width: 140, minHeight: 160, bgcolor: 'grey.200', flexShrink: 0 }} />
            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: '60%' }} />
                <Box sx={{ height: 36, bgcolor: 'grey.200', borderRadius: 1, width: '50%', alignSelf: 'flex-end' }} />
            </Box>
        </Card>
    );
}

export default function TemplatesPage() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<ResultTemplate | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['templates'],
        queryFn: () => templatesApi.list({ page: 1, tenantId: user?.tenantId, limit: 10 }),
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) =>
            templatesApi.upload(file, (pct) => setUploadProgress(pct)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            showSnackbar('Template berhasil diupload');
            resetUpload();
        },
        onError: (err) => {
            showSnackbar(extractErrorMessage(err), 'error');
            setUploadProgress(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => templatesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            showSnackbar('Template berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
            templatesApi.setStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileError('');

        if (file.type !== 'image/png') {
            setFileError('Hanya file PNG yang diperbolehkan.');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileError(`Ukuran file maksimum ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    function resetUpload() {
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(null);
        setFileError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    return (
        <Box>
            {/* ── Breadcrumb ── */}
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['grey'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                <Typography sx={{ color: colors.base['grey'], fontSize: 14 }}>Template &amp; Layout</Typography>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Your Layout</Typography>
            </Breadcrumbs>

            {/* ── Header ── */}
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Your Layout
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        bgcolor: colors.brand[500],
                        '&:hover': { bgcolor: colors.brand[600] },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Upload Layout
                </Button>
            </Stack>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                hidden
                onChange={handleFileSelect}
            />

            {/* ── Upload preview ── */}
            {(selectedFile || fileError) && (
                <Card
                    sx={{
                        mb: 3,
                        p: 2,
                        border: `1px solid ${colors.border['default']}`,
                        borderRadius: 2,
                        boxShadow: 'none',
                    }}
                >
                    {fileError ? (
                        <Typography color="error">{fileError}</Typography>
                    ) : (
                        <Stack direction="row" sx={{ gap: 2, alignItems: 'flex-start' }}>
                            {previewUrl && (
                                <Box
                                    component="img"
                                    src={previewUrl}
                                    alt="preview"
                                    sx={{
                                        width: 140,
                                        height: 160,
                                        objectFit: 'contain',
                                        border: `1px solid ${colors.border['light']}`,
                                        borderRadius: 1,
                                        bgcolor: colors.base['section'],
                                    }}
                                />
                            )}
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontWeight: 600, color: colors.base['black'] }}>
                                    {selectedFile?.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: colors.base['grey'] }}>
                                    {((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                                {uploadProgress !== null && (
                                    <Box sx={{ mt: 1 }}>
                                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1 }} />
                                        <Typography variant="caption">{uploadProgress}%</Typography>
                                    </Box>
                                )}
                                <Stack direction="row" sx={{ gap: 1, mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
                                        disabled={uploadMutation.isPending}
                                        sx={{
                                            bgcolor: colors.brand[500],
                                            '&:hover': { bgcolor: colors.brand[600] },
                                            textTransform: 'none',
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        {uploadMutation.isPending ? 'Mengupload...' : 'Upload'}
                                    </Button>
                                    <Button size="small" onClick={resetUpload} sx={{ textTransform: 'none', borderRadius: 1.5 }}>
                                        Batal
                                    </Button>
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </Card>
            )}

            {isError && <ErrorAlert onRetry={refetch} />}

            {!isLoading && data?.result?.templates?.length === 0 && (
                <EmptyState message="Belum ada layout template." />
            )}

            {/* ── Layout Cards Grid ── */}
            <Grid container spacing={2}>
                {(isLoading ? Array.from({ length: 4 }) : data?.result?.templates ?? []).map((item, idx) => {
                    const template = item as ResultTemplate["templates"][number] | undefined;

                    if (isLoading || !template) {
                        return (
                            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                <SkeletonCard />
                            </Grid>
                        );
                    }

                    return (
                        <Grid size={{ xs: 12, sm: 6 }} key={template.id}>
                            <Card
                                sx={{
                                    display: 'flex',
                                    borderRadius: 2,
                                    border: `1px solid ${colors.border['light']}`,
                                    boxShadow: 'none',
                                    overflow: 'hidden',
                                    bgcolor: colors.base['white'],
                                    transition: 'box-shadow 0.15s',
                                    '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
                                }}
                            >
                                {/* ── Thumbnail ── */}
                                <Box
                                    sx={{
                                        width: 140,
                                        minHeight: 160,
                                        flexShrink: 0,
                                        bgcolor: colors.base['section'],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={template.productionUrl}
                                        alt={template.id.toString()}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </Box>

                                {/* ── Content ── */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: 15, color: colors.base['black'] }}>
                                            {/* {template.name} */}
                                            Testt
                                        </Typography>
                                        {/* <Chip
                                            label={template.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            size="small"
                                            color={template.status === 'active' ? 'success' : 'default'}
                                            sx={{ mt: 0.5 }}
                                        /> */}
                                    </Box>

                                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        {/* Action icons */}
                                        {/* <Stack direction="row" sx={{ gap: 0.5 }}>
                                            <Tooltip title={template.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        statusMutation.mutate({
                                                            id: template.id,
                                                            status: template.status === 'active' ? 'inactive' : 'active',
                                                        })
                                                    }
                                                >
                                                    {template.status === 'active'
                                                        ? <ToggleOnIcon color="success" />
                                                        : <ToggleOffIcon color="disabled" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus">
                                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(template)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack> */}

                                        {/* Choose Layout button */}
                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{
                                                bgcolor: colors.brand[500],
                                                '&:hover': { bgcolor: colors.brand[600] },
                                                textTransform: 'none',
                                                borderRadius: 1.5,
                                                fontWeight: 600,
                                                fontSize: 13,
                                                px: 2,
                                            }}
                                        >
                                            Choose Layout
                                        </Button>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Template"
                description={`Yakin ingin menghapus template "${deleteTarget?.}"?`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            /> */}
        </Box>
    );
}

