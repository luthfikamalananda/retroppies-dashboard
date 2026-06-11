import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../stores/authStore';
import { TenantSelector } from '../components/common/TenantSelector';
import { z } from 'zod';


type TemplateItem = ResultTemplate['templates'][number];

const MAX_FILE_SIZE_MB = 10;

const formSchema = z.object({
    tenantId: z.number('Tenant wajib dipilih').min(1, 'Tenant wajib dipilih'),
});

type FormValues = z.infer<typeof formSchema>;

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
    const activeTenantId = user?.tenantId;
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const productionFileInputRef = useRef<HTMLInputElement>(null);

    const { isSuperAdmin, can } = usePermissions();
    const canCreate = can('templates:create');
    const canUpdate = can('templates:update');
    const canDelete = can('templates:delete');

    // Upload dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<TemplateItem | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');
    const [existingDisplayUrl, setExistingDisplayUrl] = useState<string | null>(null);
    const [productionPreviewUrl, setProductionPreviewUrl] = useState<string | null>(null);
    const [selectedProductionFile, setSelectedProductionFile] = useState<File | null>(null);
    const [productionFileError, setProductionFileError] = useState('');
    const [existingProductionUrl, setExistingProductionUrl] = useState<string | null>(null);

    // Delete dialog state
    const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

    const {
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { tenantId: activeTenantId || 0 },
    });

    const selectedTenantId = watch('tenantId');

    useEffect(() => {
        if (dialogOpen && !editTarget && activeTenantId) {
            setValue('tenantId', activeTenantId);
        }
    }, [dialogOpen, editTarget, activeTenantId, setValue]);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['templates', layoutId, activeTenantId],
        queryFn: () => templatesApi.list({ page: 1, tenantId: activeTenantId!, limit: 50, layoutId: Number(layoutId) }),
        enabled: !!layoutId && activeTenantId !== null,
    });

    const uploadMutation = useMutation({
        mutationFn: ({ tenantId, displayFile, productionFile }: { tenantId: number; displayFile: File; productionFile: File }) =>
            editTarget
                ? templatesApi.update(editTarget.id, tenantId, Number(layoutId), displayFile, productionFile, (pct) => setUploadProgress(pct))
                : templatesApi.upload(tenantId, Number(layoutId), displayFile, productionFile, (pct) => setUploadProgress(pct)),
        onSuccess: () => {
            const tenantId = editTarget ? editTarget.tenantId : activeTenantId;
            queryClient.invalidateQueries({ queryKey: ['templates', layoutId, tenantId] });
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
            queryClient.invalidateQueries({ queryKey: ['templates', layoutId, activeTenantId] });
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
        if (target) {
            // Edit mode: pre-fill with existing images, no file picker
            setExistingDisplayUrl(target.displayUrl);
            setExistingProductionUrl(target.productionUrl);
        } else {
            // Create mode: trigger file picker immediately
            setTimeout(() => fileInputRef.current?.click(), 100);
        }
    }

    function closeDialog() {
        setDialogOpen(false);
        setEditTarget(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setExistingDisplayUrl(null);
        setSelectedProductionFile(null);
        setProductionPreviewUrl(null);
        setExistingProductionUrl(null);
        setUploadProgress(null);
        setFileError('');
        setProductionFileError('');
        reset();
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (productionFileInputRef.current) productionFileInputRef.current.value = '';
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

    function handleProductionFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setProductionFileError('');

        if (file.type !== 'image/png') {
            setProductionFileError('Hanya file PNG yang diperbolehkan.');
            return;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setProductionFileError(`Ukuran file maksimum ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        setSelectedProductionFile(file);
        setProductionPreviewUrl(URL.createObjectURL(file));
    }

    console.log("errors", errors)

    return (
        <Box>
            {/* Hidden file input — Display */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                hidden
                onChange={handleFileSelect}
            />
            {/* Hidden file input — Production */}
            <input
                ref={productionFileInputRef}
                type="file"
                accept="image/png"
                hidden
                onChange={handleProductionFileSelect}
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
                <Link
                    component={NavLink}
                    to="/app/layouts"
                    sx={{ color: colors.base['grey'], fontSize: 14, textDecoration: 'none' }}
                >
                    Layout
                </Link>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Your Template</Typography>
            </Breadcrumbs>

            {/* ── Header ── */}
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Stack>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                        Your Layout
                    </Typography>
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', }}>
                    <TenantSelector />
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => openUploadDialog(null)}
                            sx={{
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                textWrap: 'nowrap',
                                width: { xs: '100%', sm: isSuperAdmin ? "450px" : "100%" },
                            }}
                        >
                            Upload Layout
                        </Button>
                    )}
                </Stack>

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
                                        {canUpdate && (
                                            <Tooltip title="Edit (ganti foto)">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => openUploadDialog(template)}
                                                    sx={{ color: colors.brand[500], '&:hover': { bgcolor: colors.brand[100] } }}
                                                >
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {canDelete && (
                                            <Tooltip title="Hapus">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setDeleteTarget(template)}
                                                    sx={{ color: colors.error[500], '&:hover': { bgcolor: colors.error[100] } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
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
                    <IconButton size="small" onClick={closeDialog} disabled={uploadMutation.isPending}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Tenant Selector — hanya untuk superAdmin */}
                    {(isSuperAdmin && !editTarget) && (
                        <TenantSelector
                            useLabel
                            height='40px'
                            displayNull
                            isSubmitted={!!errors.tenantId}
                            errorMsg={errors.tenantId?.message}
                            value={selectedTenantId}
                            onChange={(value) => value !== null && setValue('tenantId', value, { shouldValidate: true })}
                        />
                    )}

                    {/* ── Two file inputs side by side ── */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        {/* ── Display File ── */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                                Display File
                            </Typography>
                            {fileError ? (
                                <Typography color="error" sx={{ fontSize: 13 }}>{fileError}</Typography>
                            ) : !(selectedFile || existingDisplayUrl) ? (
                                <Box
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        py: 4,
                                        gap: 1,
                                        color: colors.base['grey'],
                                        border: `2px dashed ${colors.border['default']}`,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        '&:hover': { borderColor: colors.brand[500] },
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 32 }} />
                                    <Typography sx={{ fontSize: 13 }}>Pilih file display</Typography>
                                </Box>
                            ) : (
                                <Stack sx={{ gap: 1, alignItems: 'center' }}>
                                    <Box
                                        component="img"
                                        src={previewUrl ?? existingDisplayUrl ?? ''}
                                        alt="preview display"
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 220,
                                            objectFit: 'contain',
                                            border: `1px solid ${colors.border['light']}`,
                                            borderRadius: 2,
                                            bgcolor: colors.base['section'],
                                        }}
                                    />
                                    <Box sx={{ width: '100%' }}>
                                        {selectedFile ? (
                                            <>
                                                <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                                                    {selectedFile.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>
                                                File existing (dari server)
                                            </Typography>
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); setExistingDisplayUrl(null); setFileError(''); fileInputRef.current?.click(); }}
                                        disabled={uploadMutation.isPending}
                                        sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                                    >
                                        Ganti File
                                    </Button>
                                </Stack>
                            )}
                        </Box>

                        {/* ── Production File ── */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                                Production File
                            </Typography>
                            {productionFileError ? (
                                <Typography color="error" sx={{ fontSize: 13 }}>{productionFileError}</Typography>
                            ) : !(selectedProductionFile || existingProductionUrl) ? (
                                <Box
                                    onClick={() => productionFileInputRef.current?.click()}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        py: 4,
                                        gap: 1,
                                        color: colors.base['grey'],
                                        border: `2px dashed ${colors.border['default']}`,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        '&:hover': { borderColor: colors.brand[500] },
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 32 }} />
                                    <Typography sx={{ fontSize: 13 }}>Pilih file production</Typography>
                                </Box>
                            ) : (
                                <Stack sx={{ gap: 1, alignItems: 'center' }}>
                                    <Box
                                        component="img"
                                        src={productionPreviewUrl ?? existingProductionUrl ?? ''}
                                        alt="preview production"
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 220,
                                            objectFit: 'contain',
                                            border: `1px solid ${colors.border['light']}`,
                                            borderRadius: 2,
                                            bgcolor: colors.base['section'],
                                        }}
                                    />
                                    <Box sx={{ width: '100%' }}>
                                        {selectedProductionFile ? (
                                            <>
                                                <Typography sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                                                    {selectedProductionFile.name}
                                                </Typography>
                                                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>
                                                    {(selectedProductionFile.size / 1024 / 1024).toFixed(2)} MB
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>
                                                File existing (dari server)
                                            </Typography>
                                        )}
                                    </Box>
                                    <Button
                                        size="small"
                                        onClick={() => { setSelectedProductionFile(null); setProductionPreviewUrl(null); setExistingProductionUrl(null); setProductionFileError(''); productionFileInputRef.current?.click(); }}
                                        disabled={uploadMutation.isPending}
                                        sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
                                    >
                                        Ganti File
                                    </Button>
                                </Stack>
                            )}
                        </Box>
                    </Stack>

                    {/* Upload progress */}
                    {uploadProgress !== null && (
                        <Box sx={{ mt: 1 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 6 }} />
                            <Typography variant="caption" sx={{ color: colors.base['grey'] }}>
                                {uploadProgress}%
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={closeDialog} disabled={uploadMutation.isPending} sx={{ textTransform: 'none' }}>
                        Batal
                    </Button>
                    <Button
                        variant="contained"
                        disabled={
                            !(selectedFile || existingDisplayUrl) ||
                            !(selectedProductionFile || existingProductionUrl) ||
                            !!fileError || !!productionFileError ||
                            uploadMutation.isPending
                        }
                        onClick={handleSubmit((values) => {
                            const displayFile = selectedFile;
                            const productionFile = selectedProductionFile;
                            if (!displayFile && !existingDisplayUrl) {
                                setFileError('File display wajib dipilih');
                                return;
                            }
                            if (!productionFile && !existingProductionUrl) {
                                setProductionFileError('File production wajib dipilih');
                                return;
                            }
                            // For edit mode with no new file selected, we still need a File object.
                            // If user didn't change a file, we cannot re-send the existing URL as a File.
                            // In that case we require at least the changed files.
                            if (!displayFile || !productionFile) {
                                if (!displayFile) setFileError('Silakan pilih file display baru untuk menggantinya.');
                                if (!productionFile) setProductionFileError('Silakan pilih file production baru untuk menggantinya.');
                                return;
                            }
                            uploadMutation.mutate({ tenantId: values.tenantId, displayFile, productionFile });
                        })}
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
