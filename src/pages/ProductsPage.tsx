import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    IconButton,
    Tooltip,
    Chip,
    Select,
    MenuItem,
    Pagination,
    Breadcrumbs,
    Link,
    InputAdornment,
    Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { productsApi, type Product } from '../api/products.api';
import { useUIStore } from '../stores/uiStore';
import { useScopeStore } from '../stores/scopeStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProductFormDialog } from '../features/products/ProductFormDialog';
import { TenantSelector } from '../components/common/TenantSelector';
import { usePermissions } from '../hooks/usePermissions';
import { colors } from '../theme/colors';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const { activeTenantId } = useScopeStore();

    const { can, isSuperAdmin } = usePermissions();
    const canCreate = can('products:create');
    const canUpdate = can('products:update');
    const canDelete = can('products:delete');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

    const queryKey = ['products', activeTenantId, debouncedSearch, page, pageSize];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            productsApi.list({
                tenantId: activeTenantId,
                keyword: debouncedSearch,
                page,
                limit: pageSize,
            }),
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
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['grey'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>
                    Produk
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
            >
                <Stack sx={{ width: "50%" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                        Produk
                    </Typography>
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', width: "100%", flexGrow: 1 }}>
                    <Stack sx={{ width: "100%" }}>
                        <TenantSelector />
                    </Stack>
                    <TextField
                        size="small"
                        placeholder="Cari kode / nama produk..."
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
                        // change the height into 36px
                        // change the width into 100%

                        sx={{
                            '& .MuiInputBase-root': {
                                height: "36px",
                            },
                            width: { xs: '100%', sm: "100%" },
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
                                // px: 2.5,
                                width: "400px",
                                // width: "400px",
                            }}
                        >
                            Tambah Produk
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
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Kode</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Nama Produk</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Harga</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Aksi</TableCell>
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
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>
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
                    direction="row"
                    sx={{
                        alignItems: 'center',
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
