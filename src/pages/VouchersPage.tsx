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
    Chip,
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
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { vouchersApi, type Voucher } from '../api/vouchers.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { VoucherFormDialog } from '../features/vouchers/VoucherFormDialog';
import { colors } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';
import { TenantSelector } from '../components/common/TenantSelector';
import { useScopeStore } from '../stores/scopeStore';

type StatusChip = { label: string; bgcolor: string; color: string };

/** Parse ISO string in UTC — always reflects server time, unaffected by browser timezone */
function parseDate(isoString: string) {
    return dayjs.utc(isoString);
}

function getStatusChip(voucher: Voucher): StatusChip {
    const now = dayjs.utc();
    if (parseDate(voucher.dateTo).isBefore(now)) {
        return { label: 'Expired', bgcolor: '#FDE8E8', color: '#B23E3E' };
    }
    if (voucher.status === 'active') {
        return { label: 'Active', bgcolor: '#E8F5E9', color: '#2E7D32' };
    }
    return { label: 'Inactive', bgcolor: '#F5F5F5', color: '#757575' };
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function VouchersPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const { activeTenantId } = useScopeStore();

    const { can, isSuperAdmin } = usePermissions();
    const canCreate = can('vouchers:create');
    const canUpdate = can('vouchers:update');
    const canDelete = can('vouchers:delete');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Voucher | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // const queryKey = ['vouchers', activeTenantId, page, pageSize];
    const queryKey = ['vouchers', activeTenantId, page, pageSize, debouncedSearch];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            vouchersApi.list({
                tenantId: activeTenantId,
                keyword: debouncedSearch,
                page,
                limit: pageSize,
            }),
        // enabled: !!activeTenantId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vouchersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers', activeTenantId] });
            showSnackbar('Voucher berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    function openCreate() {
        setEditTarget(null);
        setFormOpen(true);
    }

    function openEdit(voucher: Voucher) {
        setEditTarget(voucher);
        setFormOpen(true);
    }

    const rows = data?.result?.vouchers ?? [];

    const sorted = [...rows].sort((a, b) =>
        sortDir === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
    );

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
                    Voucher
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
            >
                <Stack sx={{ width: "50%" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                        Voucher
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
                    {canCreate &&
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
                                width: "410px",
                                // width: "400px",
                            }}
                        >
                            Tambah Voucher
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
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 80  }}>#</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Voucher Code</TableCell>
                                {isSuperAdmin && <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Tenant</TableCell>}
                                <TableCell
                                    sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                                >
                                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        Promo Title
                                        <UnfoldMoreIcon sx={{ fontSize: 16, color: colors.base['grey'] }} />
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Discount</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Period</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Usage Limit</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Used</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Status</TableCell>
                                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: isSuperAdmin ? 11 : 10 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton variant="text" width="80%" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : sorted.map((v, idx) => {
                                    const chipStyle = getStatusChip(v);
                                    return (
                                        <TableRow key={v.code} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                                {(page - 1) * pageSize + idx + 1}
                                            </TableCell>

                                            <TableCell>
                                                <Chip
                                                    label={v.code}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: colors.base['section'],
                                                        color: colors.base['black'],
                                                        fontWeight: 600,
                                                        fontSize: 12,
                                                        borderRadius: 1,
                                                    }}
                                                />
                                            </TableCell>
                                            {isSuperAdmin && <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{v.tenantName}</TableCell>}
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>{v.name}</TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                                                Rp{v.value.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                {parseDate(v.dateFrom).format('DD MMM')} - {parseDate(v.dateTo).format('DD MMM')}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>{v.limitQty == 0 ? '∞' : `${v.limitQty}x`}</TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>{v.tempLimitQty}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={chipStyle.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: chipStyle.bgcolor,
                                                        color: chipStyle.color,
                                                        fontWeight: 600,
                                                        fontSize: 12,
                                                        borderRadius: 1,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" sx={{ gap: 0.5 }}>
                                                    {canUpdate && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openEdit(v)}
                                                            sx={{ color: colors.brand[500] }}
                                                        >
                                                            <EditIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    )}
                                                    {canDelete && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDeleteTarget(v)}
                                                            sx={{ color: colors.brand[500] }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && sorted.length === 0 && (
                    <EmptyState message="Belum ada voucher." />
                )}

                {/* Custom Pagination Footer */}
                <Stack
                    direction="row"
                    sx={{
                        alignItems: 'center',
                        px: 2,
                        py: 1.5,
                        borderTop: `1px solid ${colors.border['light']}`,
                    }}
                >
                    {/* Left: rows per page */}
                    <Select
                        size="small"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        sx={{ fontSize: 13, minWidth: 64, height: 32 }}
                    >
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
                                {s}
                            </MenuItem>
                        ))}
                    </Select>

                    {/* Center: count label */}
                    <Typography
                        sx={{ flex: 1, textAlign: 'center', fontSize: 13, color: colors.base['grey'] }}
                    >
                        {total === 0
                            ? 'No entries'
                            : `Showing ${fromEntry} to ${toEntry} of ${total} entries`}
                    </Typography>

                    {/* Right: page buttons */}
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

            <VoucherFormDialog
                open={formOpen}
                editTarget={editTarget}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Voucher"
                description={`Yakin ingin menghapus voucher "${deleteTarget?.name}"?`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
