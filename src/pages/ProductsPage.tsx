import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    IconButton,
    InputAdornment,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { extractErrorMessage } from '../api/client';
import { productsApi, type Product } from '../api/products.api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ProductFormDialog } from '../features/products/ProductFormDialog';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { colors } from '../theme/colors';
import { TenantSelector } from '../components/common/TenantSelector';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const activeTenantId = useAuthStore().user?.tenantId;

    const { can, isSuperAdmin } = usePermissions();
    const canCreate = can('products:create');
    const canUpdate = can('products:update');
    const canDelete = can('products:delete');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [productType, setProductType] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const queryKey = ['products', activeTenantId, debouncedSearch, page, pageSize, productType];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            productsApi.list({
                tenantId: activeTenantId!,
                keyword: debouncedSearch,
                page,
                limit: pageSize,
                productType: productType
            }),
        enabled: formOpen === false && activeTenantId !== null, // Jangan fetch data saat form dialog terbuka atau tenantId belum siap
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showSnackbar('Produk berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    function openCreate() {
        setEditTarget(null);
        setFormOpen(true);
    }

    function openEdit(product: Product) {
        setEditTarget(product);
        setFormOpen(true);
    }

    const rows = data?.result?.products ?? [];
    const total = data?.result?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const fromEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const toEntry = Math.min(page * pageSize, total);

    return (
        <Box>
            {/* Breadcrumb */}
            {/* <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['grey'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>
                    Product
                </Typography>
            </Breadcrumbs> */}

            {/* Header */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
            >
                <Stack sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'], justifySelf: "start" }}>
                        Product
                    </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: 1, width: { xs: '100%', md: 'auto' } }}>
                    <TenantSelector sx={{ flex: '1 1 180px', maxWidth: { sm: '240px' } }} />
                    <Autocomplete
                        disablePortal
                        size="small"
                        options={[{
                            label: 'Bundling',
                            value: 'bundling',
                        },
                        {
                            label: 'Add Ons',
                            value: 'addon',
                        },
                        {
                            label: 'Extra Print',
                            value: 'print',
                        }]}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        height: "36px",
                                        fontSize: 14,
                                    },
                                    bgcolor: colors.base['white']
                                }}
                                placeholder="All Types"
                            />
                        )}
                        onChange={(_, value) => setProductType(value?.value ?? '')}
                        sx={{ flex: '1 1 150px', maxWidth: { sm: '200px' }, width: { xs: '100%' } }}
                    />

                    <TextField
                        size="small"
                        placeholder="Keyword..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 18, color: colors.base['grey'] }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            '& .MuiInputBase-root': {
                                height: "36px",
                                fontSize: 14,
                            },
                            flex: '1 1 180px',
                            maxWidth: { sm: '280px' },
                            width: { xs: '100%' },
                            bgcolor: colors.base['white']
                        }}
                    />
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreate}
                            sx={{
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                width: { xs: '100%', sm: 'auto' },
                            }}
                        >
                            Add Product
                        </Button>
                    )}
                </Stack>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 80 }}>#</TableCell>
                                {isSuperAdmin && <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Tenant</TableCell>}
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Product Code</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Product Name</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Product Type</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Price</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: isSuperAdmin ? 6 : 5 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : rows.map((product, idx) => (
                                    <TableRow key={product.productCode} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], width: 80 }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        {isSuperAdmin && (
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                                {product.tenantName}
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontSize: 13, textAlign: "center" }}>
                                            <Chip label={product.productCode} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>
                                            {product.productName}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, textAlign: "center" }}>
                                            <Chip
                                                label={product.productType ?? '-'}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    textTransform: 'uppercase',
                                                    fontFamily: 'Inter, sans-serif',
                                                    ...(product.productType === "addon" ? { bgcolor: colors.brand[100], color: colors.brand[500] } : product.productType === "print" ? { bgcolor: colors.brand[100], color: colors.brand[500] } : { bgcolor: colors.brand[100], color: colors.brand[500] })
                                                }} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(product.productPrice)}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" sx={{ gap: 0.5, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                                {canUpdate && (
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => openEdit(product)} sx={{ color: colors.brand[500] }}>
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {canDelete && (
                                                    <Tooltip title="Hapus">
                                                        <IconButton size="small" onClick={() => setDeleteTarget(product)} sx={{ color: colors.error[500] }}>
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && rows.length === 0 && <EmptyState message="Belum ada produk." />}

                {/* Pagination Footer */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        borderTop: `1px solid ${colors.border['light']}`,
                    }}
                >
                    <Select
                        size="small"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        sx={{ fontSize: 13, minWidth: 64, height: 32 }}
                    >
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
                        ))}
                    </Select>

                    <Typography sx={{ flex: 1, textAlign: 'center', fontSize: 13, color: colors.base['grey'] }}>
                        {total === 0 ? 'No entries' : `Showing ${fromEntry} to ${toEntry} of ${total} entries`}
                    </Typography>

                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, p) => setPage(p)}
                        size="small"
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': { fontSize: 13 },
                            '& .MuiPaginationItem-root.Mui-selected': {
                                bgcolor: colors.brand[500],
                                color: colors.base['white'],
                                '&:hover': { bgcolor: colors.brand[600] },
                            },
                        }}
                    />
                </Stack>
            </Paper>

            <ProductFormDialog
                open={formOpen}
                editTarget={editTarget}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Produk"
                description={`Yakin ingin menghapus produk "${deleteTarget?.productName}"? Tindakan ini tidak dapat diurungkan.`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
