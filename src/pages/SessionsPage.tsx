import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
    Box,
    Chip,
    IconButton,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { sessionsApi } from '../api/sessions.api';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { TenantSelector } from '../components/common/TenantSelector';
import { FilterToolbar, filterControlSx } from '../components/common/FilterToolbar';
import { SearchField } from '../components/common/SearchField';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];


export default function SessionsPage() {
    const activeTenantId = useAuthStore().user?.tenantId ?? 0;

    const { isSuperAdmin } = usePermissions();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [publishFilter, setPublishFilter] = useState<boolean | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: [
            'sessions',
            activeTenantId,
            page,
            pageSize,
            debouncedSearch,
            publishFilter,
        ],
        queryFn: () =>
            sessionsApi.list({
                tenantId: activeTenantId,
                keyword: debouncedSearch,
                page,
                limit: pageSize,
                isPublish: publishFilter,
            }),
    });

    const rows = data?.result?.list ?? [];
    const total = data?.result?.total ?? 0;

    const totalPages = Math.max(
        1,
        Math.ceil(total / pageSize),
    );

    const fromEntry =
        total === 0
            ? 0
            : (page - 1) * pageSize + 1;

    const toEntry = Math.min(
        page * pageSize,
        total,
    );

    return (
        <Box>
            <FilterToolbar title="Session">
                <TenantSelector sx={{ width: { xs: '100%', sm: 220 } }} />
                <Select
                    size="small"
                    value={
                        publishFilter === null
                            ? 'all'
                            : publishFilter
                                ? 'true'
                                : 'false'
                    }
                    onChange={(e) => {
                        const value = e.target.value;

                        if (value === 'all') {
                            setPublishFilter(null);
                        } else {
                            setPublishFilter(value === 'true');
                        }

                        setPage(1);
                    }}
                    sx={{ ...filterControlSx, width: { xs: '100%', sm: 180 } }}
                >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="true">Allowed</MenuItem>
                    <MenuItem value="false">Not Allowed</MenuItem>
                </Select>
                <SearchField value={search} onChange={setSearch} placeholder="Search session…" />
            </FilterToolbar>

            {isError && (
                <ErrorAlert onRetry={refetch} />
            )}

            <Paper
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${colors.border['default']}`,
                    boxShadow: 'none',
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead sx={{
                            bgcolor: colors.brand[100],
                            fontWeight: 600,
                            fontSize: 13,
                            color: colors.base['black'],
                            textWrap: 'nowrap',
                        }}>
                            <TableRow hover
                                sx={{
                                    '&:hover': {
                                        bgcolor: colors.base['background-light'],
                                    },
                                }}>
                                <TableCell sx={{
                                    bgcolor: colors.brand[100],
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: colors.base['black'],
                                    textAlign: 'center',
                                }}>#</TableCell>

                                {isSuperAdmin && (
                                    <TableCell sx={{
                                        bgcolor: colors.brand[100],
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: colors.base['black'],
                                        textAlign: 'center',
                                    }}>Tenant</TableCell>
                                )}

                                <TableCell sx={{
                                    bgcolor: colors.brand[100],
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: colors.base['black'],
                                    textAlign: 'center',
                                }}>
                                    Invoice Number
                                </TableCell>

                                <TableCell sx={{
                                    bgcolor: colors.brand[100],
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: colors.base['black'],
                                    textAlign: 'center',
                                }}>
                                    Session Code
                                </TableCell>

                                <TableCell sx={{
                                    bgcolor: colors.brand[100],
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: colors.base['black'],
                                    textAlign: 'center',
                                }} align="center">
                                    Allow to Publish
                                </TableCell>

                                <TableCell sx={{
                                    bgcolor: colors.brand[100],
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: colors.base['black'],
                                    textAlign: 'center',
                                }} align="center">
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 5 }).map(
                                    (_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({
                                                length: isSuperAdmin
                                                    ? 7
                                                    : 6,
                                            }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton
                                                        variant="text"
                                                        width="80%"
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ),
                                )
                                :
                                rows.map((session, idx) => (
                                    <TableRow
                                        key={session.id}
                                        hover
                                    >
                                        <TableCell>
                                            {(page - 1) * pageSize +
                                                idx +
                                                1}
                                        </TableCell>

                                        {isSuperAdmin && (
                                            <TableCell>
                                                {session.tenantName}
                                            </TableCell>
                                        )}

                                        <TableCell>
                                            {session.invoiceNumber}
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                label={session.sessionCode}
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

                                        <TableCell align="center">
                                            <Chip
                                                label={
                                                    session.isPublish
                                                        ? 'Allowed'
                                                        : 'Not Allowed'
                                                }
                                                size="small"
                                                sx={{
                                                    bgcolor: session.isPublish
                                                        ? '#E8F5E9'
                                                        : colors.brand[100],
                                                    color: session.isPublish
                                                        ? '#2E7D32'
                                                        : '#c00b0b',
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    borderRadius: 1,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Stack
                                                direction="row"
                                                sx={{ gap: 0.5 }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        window.open(
                                                            session.resultUrl,
                                                            '_blank',
                                                            'noopener,noreferrer'
                                                        )
                                                    }
                                                    sx={{
                                                        color: colors.brand[500],
                                                    }}
                                                >
                                                    <VisibilityOutlinedIcon
                                                        sx={{ fontSize: 18 }}
                                                    />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!isLoading &&
                    rows.length === 0 && (
                        <EmptyState message="Belum ada data session." />
                    )}

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        borderTop: `1px solid ${colors.border['light']}`,
                    }}
                >
                    <Select
                        size="small"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(
                                Number(
                                    e.target.value,
                                ),
                            );
                            setPage(1);
                        }}
                        sx={{
                            fontSize: 13,
                            minWidth: 64,
                            height: 32,
                        }}
                    >
                        {PAGE_SIZE_OPTIONS.map(
                            (s) => (
                                <MenuItem
                                    key={s}
                                    value={s}
                                >
                                    {s}
                                </MenuItem>
                            ),
                        )}
                    </Select>

                    <Typography
                        sx={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: 13,
                            color: colors.base['grey'],
                        }}
                    >
                        {total === 0
                            ? 'No entries'
                            : `Showing ${fromEntry} to ${toEntry} of ${total} entries`}
                    </Typography>

                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, p) => setPage(p)}
                        size="small"
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                fontSize: 13,
                            },
                            '& .MuiPaginationItem-root.Mui-selected':
                            {
                                bgcolor: colors.brand[500],
                                color: colors.base['white'],
                                '&:hover': {
                                    bgcolor: colors.brand[600],
                                },
                            },
                        }}
                    />
                </Stack>
            </Paper>
        </Box>
    );
}