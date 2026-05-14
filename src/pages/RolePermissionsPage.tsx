import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import {
    Box,
    Breadcrumbs,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
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
    Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { permissionsApi } from '../api/permissions.api';
import { rolesApi } from '../api/roles.api';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useUIStore } from '../stores/uiStore';
import { colors } from '../theme/colors';

function parsePermission(name: string): { module: string; task: string } {
    const idx = name.indexOf(':');
    if (idx === -1) return { module: 'General', task: name.replace(/_/g, ' ').toUpperCase() };
    return {
        module: name.substring(0, idx).replace(/_/g, ' ').toUpperCase(),
        task: name.substring(idx + 1).replace(/_/g, ' ').toUpperCase(),
    };
}

export default function RolePermissionsPage() {
    const { id } = useParams<{ id: string }>();
    const roleId = Number(id);
    const navigate = useNavigate();
    const showSnackbar = useUIStore((s) => s.showSnackbar);
    const queryClient = useQueryClient();

    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [initialized, setInitialized] = useState(false);

    // Fetch all roles (to get role name)
    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rolesApi.list(),
    });
    const role = rolesData?.result?.find((r) => r.ID === roleId);

    // Fetch all permissions
    const {
        data: permsData,
        isLoading: permsLoading,
        isError: permsError,
        refetch: refetchPerms,
    } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => permissionsApi.list(),
    });

    // Fetch currently assigned permissions for this role
    const {
        data: rolePermsData,
        isLoading: rolePermsLoading,
        isError: rolePermsError,
        refetch: refetchRolePerms,
    } = useQuery({
        queryKey: ['role-permissions', roleId],
        queryFn: () => permissionsApi.getByRole(roleId),
        enabled: !!roleId && !isNaN(roleId),
    });

    // Initialize checkboxes once role permissions data arrives
    useEffect(() => {
        if (rolePermsData && !initialized) {
            const ids = new Set((rolePermsData.result.permissions ?? []).map((p) => p.id));
            setCheckedIds(ids);
            setInitialized(true);
        }
    }, [rolePermsData, initialized]);

    // Group permissions by module (prefix before ":")
    const grouped = useMemo(() => {
        const perms = permsData?.result ?? [];
        const map = new Map<string, Array<{ id: number; task: string }>>();
        for (const perm of perms) {
            const { module, task } = parsePermission(perm.name);
            if (!map.has(module)) map.set(module, []);
            map.get(module)!.push({ id: perm.id, task });
        }
        return map;
    }, [permsData]);

    const isLoading = rolesLoading || permsLoading || rolePermsLoading;
    const isError = permsError || rolePermsError;

    const assignMutation = useMutation({
        mutationFn: () =>
            permissionsApi.assign({ role_id: roleId, permission_ids: [...checkedIds] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] });
            showSnackbar('Permission berhasil disimpan');
            navigate('/app/roles');
        },
    });

    const handleToggle = (permId: number) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(permId)) next.delete(permId);
            else next.add(permId);
            return next;
        });
    };

    const handleRetry = () => {
        refetchPerms();
        refetchRolePerms();
    };

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
                <Link
                    component={NavLink}
                    to="/app/roles"
                    sx={{ color: colors.base['grey'], fontSize: 14, textDecoration: 'none' }}
                >
                    Role
                </Link>
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>
                    Pengaturan Task Role
                </Typography>
            </Breadcrumbs>

            <Paper
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${colors.border['default']}`,
                    boxShadow: 'none',
                    p: 3,
                }}
            >
                {/* Header */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2.5, gap: 2 }}
                >
                    <Button
                        startIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
                        onClick={() => navigate('/app/roles')}
                        sx={{
                            color: colors.base['black'],
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 20,
                            px: 0,
                            '&:hover': { bgcolor: 'transparent', color: colors.brand[500] },
                        }}
                    >
                        Pengaturan Task Role
                    </Button>
                    <Button
                        variant="contained"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate()}
                        sx={{
                            bgcolor: colors.brand[500],
                            '&:hover': { bgcolor: colors.brand[600] },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            minWidth: 120,
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        {assignMutation.isPending ? (
                            <CircularProgress size={18} sx={{ color: colors.base['white'] }} />
                        ) : (
                            'Save & Close'
                        )}
                    </Button>
                </Stack>

                {/* Role info */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontSize: 13, color: colors.base['grey'], mb: 0.25 }}>
                        Name Role
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: colors.base['black'] }}>
                        {rolesLoading ? <Skeleton sx={{ display: 'inline-block', width: 200 }} /> : (role?.Name ?? '-')}
                    </Typography>
                </Box>

                {isError && <ErrorAlert onRetry={handleRetry} />}

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: colors.base['section'] }}>
                                <TableCell
                                    sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 48 }}
                                >
                                    #
                                </TableCell>
                                <TableCell
                                    sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 200 }}
                                >
                                    Modul
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>
                                    Task
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 3 }).map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton variant="text" width="80%" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : Array.from(grouped.entries()).map(([module, tasks], idx) => (
                                    <TableRow
                                        key={module}
                                        sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}
                                    >
                                        <TableCell
                                            sx={{
                                                fontSize: 13,
                                                color: colors.base['black'],
                                                verticalAlign: 'top',
                                                pt: 1.5,
                                            }}
                                        >
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontSize: 13,
                                                color: colors.base['black'],
                                                verticalAlign: 'top',
                                                pt: 1.5,
                                            }}
                                        >
                                            {module}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {tasks.map((task) => (
                                                    <FormControlLabel
                                                        key={task.id}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={checkedIds.has(task.id)}
                                                                onChange={() => handleToggle(task.id)}
                                                                sx={{
                                                                    color: colors.base['grey'],
                                                                    '&.Mui-checked': {
                                                                        color: colors.brand[500],
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography
                                                                sx={{ fontSize: 12, color: colors.base['black'] }}
                                                            >
                                                                {task.task}
                                                            </Typography>
                                                        }
                                                        sx={{ mr: 1.5 }}
                                                    />
                                                ))}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && grouped.size === 0 && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: 14, color: colors.base['grey'] }}>
                            Belum ada data permission.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
