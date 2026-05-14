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
dayjs.extend(utc);

export default function RolesPage() {
    const queryClient = useQueryClient();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const navigate = useNavigate();

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

            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Data Role
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
                        sx={{ width: 200, bgcolor: colors.base['white'] }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setFormOpen(true); }}
                        sx={{
                            bgcolor: colors.brand[500],
                            '&:hover': { bgcolor: colors.brand[600] },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                        }}
                    >
                        Add Role
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
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Role Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Tanggal Dibuat</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Action</TableCell>
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
                                : rows.map((role, idx) => (
                                    <TableRow key={role.ID} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{role.Name}</TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                                            {dayjs.utc(role.CreatedAt).format('DD MMM YYYY')}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" sx={{ gap: 0.5 }}>
                                                <IconButton size="small" onClick={() => navigate(`/app/roles/${role.ID}/permissions`)} sx={{ color: colors.brand[500] }}>
                                                    <SettingIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => setDeleteTarget(role)} sx={{ color: colors.brand[500] }}>
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
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
