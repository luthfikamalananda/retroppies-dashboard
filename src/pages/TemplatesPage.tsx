import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Stack,
    Grid,
    Card,
    LinearProgress,
    Breadcrumbs,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { NavLink, useParams } from 'react-router-dom';
import { templatesApi, type ResultTemplate } from '../api/templates.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';

type TemplateItem = ResultTemplate['templates'][number];

const MAX_FILE_SIZE_MB = 10;

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
    const { layoutId } = useParams<{ layoutId: string }>();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<TemplateItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');

    // Delete dialog state
    const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['templates', layoutId, user?.tenantId],
        queryFn: () => templatesApi.list({ page: 1, tenantId: user?.tenantId ?? 0, limit: 50, layoutId: Number(layoutId) }),
        enabled: !!layoutId,
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) =>
            editTarget
                ? templatesApi.update(editTarget.id, user?.tenantId ?? 0, Number(layoutId), file, (pct) => setUploadProgress(pct))
                : templatesApi.upload(user?.tenantId ?? 0, Number(layoutId), file, (pct) => setUploadProgress(pct)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            showSnackbar(editTarget ? 'Template berhasil diperbarui' : 'Template berhasil diupload');
            closeDialog();
        },
        onError: (err) => {
            showSnackbar(extractErrorMessage(err), 'error');
            setUploadProgress(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => templatesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            showSnackbar('Template berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => {
            showSnackbar(extractErrorMessage(err), 'error');
            setDeleteTarget(null);
        },
    });

    function openUploadDialog(target: TemplateItem | null = null) {
        setEditTarget(target);
        setDialogOpen(true);
        // Trigger file picker immediately
        setTimeout(() => fileInputRef.current?.click(), 100);
    }

    function closeDialog() {
        setDialogOpen(false);
        setEditTarget(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploadProgress(null);
        setFileError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileError('');

        if (file.type !== 'image/png') {
            setFileError('Hanya file PNG yang diperbolehkan.');
            setDialogOpen(true);
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setFileError(`Ukuran file maksimum ${MAX_FILE_SIZE_MB}MB.`);
            setDialogOpen(true);
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setDialogOpen(true);
    }

    return (
        <Box>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                hidden
                onChange={handleFileSelect}
            />

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
                <Link
                    component={NavLink}
                    to="/app/layouts"
                    sx={{ color: colors.base['grey'], fontSize: 14, textDecoration: 'none' }}
                >
                    Layout
                </Link>
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
                    onClick={() => openUploadDialog(null)}
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

            {isError && <ErrorAlert onRetry={refetch} />}

            {!isLoading && data?.result?.templates?.length === 0 && (
                <EmptyState message="Belum ada layout template." />
            )}

            {/* ── Layout Cards Grid ── */}
            <Grid container spacing={2}>
                {(isLoading ? Array.from({ length: 4 }) : data?.result?.templates ?? []).map((item, idx) => {
                    const template = item as TemplateItem | undefined;

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
                                        src={template.displayUrl}
                                        alt={template.id.toString()}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </Box>

                                {/* ── Content ── */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['grey'] }}>
                                        ID: {template.id}
                                    </Typography>

                                    <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                                        <Tooltip title="Edit (ganti foto)">
                                            <IconButton
                                                size="small"
                                                onClick={() => openUploadDialog(template)}
                                                sx={{ color: colors.brand[500], '&:hover': { bgcolor: colors.brand[100] } }}
                                            >
                                                <EditIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Hapus">
                                            <IconButton
                                                size="small"
                                                onClick={() => setDeleteTarget(template)}
                                                sx={{ color: colors.error[500], '&:hover': { bgcolor: colors.error[100] } }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ── Upload / Edit Dialog ── */}
            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                        {editTarget ? 'Ganti Foto Template' : 'Upload Template Baru'}
                    </Typography>
                    <IconButton size="small" onClick={closeDialog}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {fileError ? (
                        <Typography color="error" sx={{ fontSize: 14 }}>{fileError}</Typography>
                    ) : !selectedFile ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 6,
                                gap: 1.5,
                                color: colors.base['grey'],
                                border: `2px dashed ${colors.border['default']}`,
                                borderRadius: 2,
                            }}
                        >
                            <AddIcon sx={{ fontSize: 40 }} />
                            <Typography sx={{ fontSize: 14 }}>Memilih file...</Typography>
                        </Box>
                    ) : (
                        <Stack sx={{ gap: 2, alignItems: 'center' }}>
                            {/* Large preview */}
                            <Box
                                component="img"
                                src={previewUrl ?? ''}
                                alt="preview"
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: 360,
                                    objectFit: 'contain',
                                    border: `1px solid ${colors.border['light']}`,
                                    borderRadius: 2,
                                    bgcolor: colors.base['section'],
                                }}
                            />
                            <Box sx={{ width: '100%' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: 14, color: colors.base['black'] }}>
                                    {selectedFile.name}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: colors.base['grey'] }}>
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                                {uploadProgress !== null && (
                                    <Box sx={{ mt: 1.5 }}>
                                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 6 }} />
                                        <Typography variant="caption" sx={{ color: colors.base['grey'] }}>
                                            {uploadProgress}%
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        size="small"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileError(''); fileInputRef.current?.click(); }}
                        disabled={uploadMutation.isPending}
                        sx={{ textTransform: 'none' }}
                    >
                        Pilih File Lain
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={closeDialog} disabled={uploadMutation.isPending} sx={{ textTransform: 'none' }}>
                        Batal
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!selectedFile || !!fileError || uploadMutation.isPending}
                        onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
                        sx={{
                            bgcolor: colors.brand[500],
                            '&:hover': { bgcolor: colors.brand[600] },
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {uploadMutation.isPending ? 'Mengupload...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Confirm Delete ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Template"
                description={`Yakin ingin menghapus template #${deleteTarget?.id}?`}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
