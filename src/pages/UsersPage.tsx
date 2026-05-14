import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Stack,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    Breadcrumbs,
    Link,
    Skeleton,
    Pagination,
    Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { usersApi, type User } from '../api/users.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { colors } from '../theme/colors';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function UsersPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editTarget] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['users', page, pageSize, debouncedSearch],
        queryFn: () => usersApi.list({ keyword: debouncedSearch, page, limit: pageSize }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSnackbar('User berhasil dihapus');
            setDeleteTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    const rows = data?.result?.users ?? [];
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
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>User</Typography>
            </Breadcrumbs>

            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Data User
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
                    {/* <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setEditTarget(null); setFormOpen(true); }}
                        sx={{
                            bgcolor: colors.brand[500],
                            '&:hover': { bgcolor: colors.brand[600] },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                        }}
                    >
                        Add User
                    </Button> */}
                </Stack>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: colors.base['section'] }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 80 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Username</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: "center" }}>Tenant</TableCell>
                                {/* <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Action</TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : rows.map((user, idx) => (
                                    <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], width: 80 }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{user.username}</TableCell>
                                        <TableCell>
                                            <Stack
                                                sx={{ width: "100%", justifyContent: "center", alignItems: "center" }}
                                            >
                                                <Chip
                                                    label={user.role_name}
                                                    size="small"
                                                    sx={{
                                                        width: "fit-content",
                                                        bgcolor: user.tenant_id === -99 ? colors.brand[100] : colors.base['section'],
                                                        color: user.tenant_id === -99 ? colors.brand[500] : colors.base['black'],
                                                        fontWeight: 600,
                                                        fontSize: 12,
                                                        borderRadius: 1
                                                    }}
                                                />
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>{user.tenant_name ?? "-"}</TableCell>
                                        {/* <TableCell>
                                            <Stack direction="row" sx={{ gap: 0.5 }}>
                                                <IconButton size="small" onClick={() => { setEditTarget(user); setFormOpen(true); }} sx={{ color: colors.brand[500] }}>
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => setDeleteTarget(user)} sx={{ color: colors.brand[500] }}>
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Stack>
                                        </TableCell> */}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && rows.length === 0 && <EmptyState message="Belum ada data user." />}

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

            <UserFormDialog open={formOpen} editTarget={editTarget} onClose={() => setFormOpen(false)} />

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus User"
                description={`Yakin ingin menghapus user "${deleteTarget?.username}"?`}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onCancel={() => setDeleteTarget(null)}
                loading={deleteMutation.isPending}
            />
        </Box>
    );
}
