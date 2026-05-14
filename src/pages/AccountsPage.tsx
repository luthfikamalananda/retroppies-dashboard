import { useState } from 'react';
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
    TablePagination,
    Chip,
    TextField,
} from '@mui/material';
import { accountsApi, type Account } from '../api/accounts.api';
import { useUIStore } from '../stores/uiStore';
import { useScopeStore } from '../stores/scopeStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { RoleEditDialog } from '../features/accounts/RoleEditDialog';

export default function AccountsPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const { activeTenantId } = useScopeStore();
    // const { can } = usePermissions();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(15);
    const [editTarget, setEditTarget] = useState<Account | null>(null);

    const queryKey = ['accounts', activeTenantId, search, page, pageSize];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: () =>
            accountsApi.list({ search, page: page + 1, page_size: pageSize }),
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            accountsApi.updateRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            showSnackbar('Role berhasil diperbarui');
            setEditTarget(null);
        },
        onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
    });

    return (
        <Box>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Manajemen Akun
                </Typography>
            </Stack>

            <Stack direction="row" sx={{ mb: 2 }}>
                <TextField
                    placeholder="Cari nama / email..."
                    size="small"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                />
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nama</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Tenant / Outlet</TableCell>
                                <TableCell>Status</TableCell>
                                {/* {can('accounts:write') && <TableCell align="center">Aksi</TableCell>} */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : data?.data.map((account) => (
                                    <TableRow key={account.user_id} hover>
                                        <TableCell>{account.name}</TableCell>
                                        <TableCell>{account.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={account.role}
                                                size="small"
                                                variant="outlined"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {account.tenant_id}
                                            {account.outlet_id ? ` / ${account.outlet_id}` : ''}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={account.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                size="small"
                                                color={account.status === 'active' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        {/* {can('accounts:write') && (
                                            <TableCell align="center">
                                                <Tooltip title="Ubah Role">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setEditTarget(account)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )} */}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && data?.data.length === 0 && (
                    <EmptyState message="Tidak ada akun ditemukan." />
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

            <RoleEditDialog
                open={!!editTarget}
                account={editTarget}
                onClose={() => setEditTarget(null)}
                onSave={(role) =>
                    editTarget && roleMutation.mutate({ userId: editTarget.user_id, role })
                }
                loading={roleMutation.isPending}
            />
        </Box>
    );
}
