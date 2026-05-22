import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    Stack,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    IconButton,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    Breadcrumbs,
    Link,
    Skeleton,
    Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { tenantsApi, type Tenant } from '../api/tenants.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TenantFormDialog } from '../features/tenants/TenantFormDialog';
import { colors } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function TenantsPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const { can } = usePermissions();
    const canCreate = can('tenants:create');
    const canUpdate = can('tenants:update');
    const canDelete = can('tenants:delete');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Tenant | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['tenants', page, pageSize, debouncedSearch],
        queryFn: () => tenantsApi.list({
            keyword: debouncedSearch,
            page,
            limit: pageSize,
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => tenantsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            showSnackbar('Tenant berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    const rows = data?.result?.tenants ?? [];
    const total = data?.result?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const fromEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const toEntry = Math.min(page * pageSize, total);

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
                <Link
                    component={NavLink}
                    to="/app/dashboard"
                    sx={{ display: 'flex', alignItems: 'center', color: colors.base['grey'], textDecoration: 'none' }}
                >
                    <HomeIcon sx={{ fontSize: 18 }} />
                </Link>
                <Typography sx={{ color: colors.base['grey'], fontSize: 14 }}>Settings User</Typography>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Data Tenant</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
            >
                <Stack sx={{ width: "50%" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                        Data Unit Tenant
                    </Typography>
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', width: "40%", }}>
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
                        sx={{
                            '& .MuiInputBase-root': {
                                height: "36px",
                            },
                            width: { xs: '100%', sm: "100%" },
                            bgcolor: colors.base['white']
                        }}
                    />
                    {canCreate &&
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { setEditTarget(null); setFormOpen(true); }}
                            sx={{
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                // px: 2.5,
                                width: "250px",
                                // width: "400px",
                            }}
                        >
                            Tambah Tenant
                        </Button>
                    }
                </Stack>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base["black"], bgcolor: colors.brand[100], width: 80  }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base["black"], bgcolor: colors.brand[100] }}>Tenant Code</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base["black"], bgcolor: colors.brand[100], textAlign: "center" }}>Tenant Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base["black"], bgcolor: colors.brand[100], textAlign: "center" }}>Address</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base["black"], bgcolor: colors.brand[100], textAlign: "center" }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : rows.map((tenant, idx) => (
                                    <TableRow key={tenant.id} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{tenant.tenant_code}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>{tenant.name}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>{tenant.address}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>
                                            <Stack direction="row" sx={{ gap: 0.5, justifyContent: 'center' }}>
                                                {canUpdate && (
                                                    <IconButton size="small" onClick={() => { setEditTarget(tenant); setFormOpen(true); }} sx={{ color: colors.brand[500] }}>
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                )}
                                                {canDelete && (
                                                    <IconButton size="small" onClick={() => setDeleteTarget(tenant)} sx={{ color: colors.brand[500] }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && rows.length === 0 && <EmptyState message="Belum ada data tenant." />}

                <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1.5, borderTop: `1px solid ${colors.border['light']}` }}>
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

            <TenantFormDialog open={formOpen} editTarget={editTarget} onClose={() => setFormOpen(false)} />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Tenant"
                description={`Yakin ingin menghapus tenant "${deleteTarget?.name}"?`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
