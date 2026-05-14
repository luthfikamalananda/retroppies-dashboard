import HomeIcon from '@mui/icons-material/Home';
import {
    Box,
    Breadcrumbs,
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
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { permissionsApi } from '../api/permissions.api';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { colors } from '../theme/colors';
dayjs.extend(utc);

export default function PermissionsPage() {

    const [page] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => permissionsApi.list(),
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
                <Typography sx={{ color: colors.base['black'], fontSize: 14, fontWeight: 500 }}>Permission</Typography>
            </Breadcrumbs>

            <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
            >
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
                    Data Permission
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
                        Add Permission
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
                                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Permission</TableCell>

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
                                : rows.map((perm, idx) => (
                                    <TableRow key={perm.id} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], width: 80 }}>
                                            {(page - 1) * pageSize + idx + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 13, color: colors.base['black'], fontFamily: 'monospace' }}>{perm.name}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading && rows.length === 0 && <EmptyState message="Belum ada data permission." />}

                {/* <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1.5, borderTop: `1px solid ${colors.border['light']}` }}>
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
                </Stack> */}
            </Paper>
        </Box>
    );
}
