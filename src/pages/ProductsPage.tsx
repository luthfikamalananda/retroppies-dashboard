import { useState } from 'react';
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
    TablePagination,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { productsApi, type Product } from '../api/products.api';
import { useUIStore } from '../stores/uiStore';
import { useScopeStore } from '../stores/scopeStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ProductFormDialog } from '../features/products/ProductFormDialog';

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const { activeTenantId } = useScopeStore();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Product | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

    const queryKey = ['products', activeTenantId, search, page, pageSize];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            productsApi.list({ search, page: page + 1, page_size: pageSize }),
    });

    const deleteMutation = useMutation({
        mutationFn: (code: string) => productsApi.delete(code),
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

    return (
        <Box>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Produk
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                    Tambah Produk
                </Button>
            </Stack>

            <Stack direction="row" sx={{ mb: 2 }}>
                <TextField
                    placeholder="Cari kode / nama produk..."
                    size="small"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Kode</TableCell>
                                <TableCell>Nama Produk</TableCell>
                                <TableCell>Harga</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.data.map((product) => (
                                    <TableRow key={product.product_code} hover>
                                        <TableCell>
                                            <Chip label={product.product_code} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{product.product_name}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(product.price)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEdit(product)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteTarget(product)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && data?.data.length === 0 && (
                    <EmptyState message="Belum ada produk." />
                )}

                <TablePagination
                    component="div"
                    count={data?.total ?? 0}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={[pageSize]}
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
                />
            </Paper>

            <ProductFormDialog
                open={formOpen}
                editTarget={editTarget}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Produk"
                description={`Yakin ingin menghapus produk "${deleteTarget?.product_name}"? Tindakan ini tidak dapat diurungkan.`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.product_code)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
