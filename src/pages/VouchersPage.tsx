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
import { useAuthStore } from '../stores/authStore';

type StatusChip = { label: string; bgcolor: string; color: string };

/** Parse ISO string in UTC — always reflects server time, unaffected by browser timezone */
function parseDate(isoString: string) {
    return dayjs.utc(isoString);
}

function getStatusChip(voucher: Voucher): StatusChip {
    const now = dayjs.utc();
    if (parseDate(voucher.date_to).isBefore(now)) {
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
    const { user } = useAuthStore();

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
    const queryKey = ['vouchers', page, pageSize, debouncedSearch];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            vouchersApi.list({
                tenant_id: user?.tenantId ?? 0,
                keyword: debouncedSearch,
                page,
                limit: pageSize,
            }),
        // enabled: !!activeTenantId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vouchersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vouchers'] });
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
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Voucher
                </Typography>
                <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        size="small"
                        placeholder="Search"
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
                        sx={{ width: { xs: '100%', sm: 200 }, bgcolor: colors.base['white'] }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={openCreate}
                        sx={{
                            bgcolor: colors.brand[500],
                            '&:hover': { bgcolor: colors.brand[600] },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                        }}
                    >
                        Create Voucher
                    </Button>
                </Stack>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: colors.base['section'] }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 48 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Voucher Code</TableCell>
                                <TableCell
                                    sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                                >
                                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                        Promo Title
                                        <UnfoldMoreIcon sx={{ fontSize: 16, color: colors.base['grey'] }} />
                                    </Stack>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Discount</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Period</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Usage Limit</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Used</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 10 }).map((_, j) => (
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
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{v.name}</TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                                Rp{v.value.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'], whiteSpace: 'nowrap' }}>
                                                {parseDate(v.date_from).format('DD MMM')} - {parseDate(v.date_to).format('DD MMM')}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{v.limit_qty == 0 ? '∞' : `${v.limit_qty}x`}</TableCell>
                                            <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{v.temp_limit_qty}</TableCell>
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
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openEdit(v)}
                                                        sx={{ color: colors.brand[500] }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDeleteTarget(v)}
                                                        sx={{ color: colors.brand[500] }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
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
