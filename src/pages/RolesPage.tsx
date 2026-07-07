import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import SettingIcon from '@mui/icons-material/Settings';
import {
    Box,
    Breadcrumbs,
    Button,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { rolesApi, type Role } from '../api/roles.api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { RoleFormDialog } from '../features/roles/RoleFormDialog';
import { useUIStore } from '../stores/uiStore';
import { colors } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';
dayjs.extend(utc);

export default function RolesPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const navigate = useNavigate();

    const { can } = usePermissions();
    const canCreate = can('roles:create');
    const canUpdate = can('roles:update');
    const canDelete = can('roles:delete');

    const [page] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesApi.list(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => rolesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            showSnackbar('Role berhasil dihapus');
            setDeleteTarget(null);
        },
    });


    const rows = data?.result ?? [];
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
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Role</Typography>
            </Breadcrumbs>

            {/* <Stack
                direction={{ xs: 'column', lg: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
            >
                <Stack sx={{ width: { xs: '100%', lg: '50%' } }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                        Data Role
                    </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
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
                        sx={{
                            '& .MuiInputBase-root': {
                                height: "36px",
                                fontSize: 14,
                            },
                            width: { xs: '100%', sm: "100%" },
                            bgcolor: colors.base['white']
                        }}
                    />
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { setFormOpen(true); }}
                            sx={{
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                width: { xs: '100%', sm: "420px" },
                            }}
                        >
                            Tambah Role
                        </Button>
                    )}
                </Stack>
            </Stack> */}

            {/* Header */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 3, gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'], flexShrink: 0 }}>
                    Data Role
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Masukkan keyword..."
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
                    {canCreate &&
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { setFormOpen(true); }}
                            sx={{
                                bgcolor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                width: { xs: '100%', sm: 'auto' },
                            }}
                        >
                            Tambah Role
                        </Button>
                    }
                </Stack>
            </Stack>

            {isError && <ErrorAlert onRetry={refetch} />}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: colors.base['section'] }}>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], bgcolor: colors.brand[100], width: 80 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], bgcolor: colors.brand[100] }}>Role Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], bgcolor: colors.brand[100], textAlign: "center" }}>Tanggal Dibuat</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], bgcolor: colors.brand[100], textAlign: "center" }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : rows.map((role, idx) => (
                                    <TableRow key={role.ID} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{role.Name}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: "center" }}>
                                            {dayjs.utc(role.CreatedAt).format('DD MMM YYYY')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: "center" }}>
                                            <Stack direction="row" sx={{ gap: 0.5, justifyContent: "center" }}>
                                                {canUpdate && (
                                                    <IconButton size="small" onClick={() => navigate(`/app/roles/${role.ID}/permissions`)} sx={{ color: colors.brand[500] }}>
                                                        <SettingIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                )}
                                                {canDelete && (
                                                    <IconButton size="small" onClick={() => setDeleteTarget(role)} sx={{ color: colors.brand[500] }}>
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

                {!isLoading && rows.length === 0 && <EmptyState message="Belum ada data role." />}
            </Paper>

            <RoleFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Hapus Role"
                description="Anda yakin ingin menghapus role ini?"
                confirmLabel="Hapus"
                cancelLabel="Batal"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.ID)}
            />
        </Box>
    );
}
