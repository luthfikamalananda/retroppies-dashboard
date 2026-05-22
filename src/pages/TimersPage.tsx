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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { timersApi, type Rule } from '../api/timers.api';
import { useUIStore } from '../stores/uiStore';
import { extractErrorMessage } from '../api/client';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TimerFormDialog } from '../features/timers/TimerFormDialog';
import { colors } from '../theme/colors';
import { usePermissions } from '../hooks/usePermissions';
import { TenantSelector } from '../components/common/TenantSelector';
import { useScopeStore } from '../stores/scopeStore';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const RULE_TYPE_LABELS: Record<string, string> = {
  payment_timer: 'Timer Pembayaran',
  photo_session_timer: 'Timer Sesi Foto',
};

export default function TimersPage() {
  const queryClient = useQueryClient();
  const showSnackbar = useUIStore((s) => s.showSnackbar);

  const { can, isSuperAdmin } = usePermissions();
  const canCreate = can('rules:create');
  const canUpdate = can('rules:update');
  const canDelete = can('rules:delete');
  const { activeTenantId } = useScopeStore()

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['timers', activeTenantId, page, pageSize, debouncedSearch],
    queryFn: () =>
      timersApi.get({
        tenantId: activeTenantId,
        keyword: debouncedSearch,
        page,
        limit: pageSize,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timers', activeTenantId] });
      showSnackbar('Rule berhasil dihapus');
      setDeleteTarget(null);
    },
    onError: (err) => showSnackbar(extractErrorMessage(err), 'error'),
  });

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(rule: Rule) {
    setEditTarget(rule);
    setFormOpen(true);
  }

  const rows = data?.result?.rules ?? [];
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
          Pengaturan Timer
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}
      >
        <Stack sx={{ width: "50%" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
            Pengaturan Timer
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
                width: "400px",
                // width: "400px",
              }}
            >
              Tambah Rule
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
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 80 }}>#</TableCell>
                {isSuperAdmin && <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Tenant</TableCell>}
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Tipe Rule</TableCell>
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Nilai (detik)</TableCell>
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Dibuat Oleh</TableCell>
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Diperbarui</TableCell>
                <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isSuperAdmin ? 7 : 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
                : rows.map((rule, idx) => (
                  <TableRow key={rule.id} hover sx={{ '&:hover': { bgcolor: colors.base['background-light'] } }}>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], width: 80 }}>
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                        {rule.tenantName}
                      </TableCell>
                    )}
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {RULE_TYPE_LABELS[rule.rulesType] ?? rule.rulesType}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {rule.value}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {rule.createdBy}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {dayjs.utc(rule.updatedAt).format('DD MMM YYYY')}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ gap: 0.5, width: "100%", justifyContent: "center", alignItems: "center" }}>
                        {canUpdate && (
                          <IconButton size="small" onClick={() => openEdit(rule)} sx={{ color: colors.brand[500] }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton size="small" onClick={() => setDeleteTarget(rule)} sx={{ color: colors.brand[500] }}>
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

        {!isLoading && rows.length === 0 && <EmptyState message="Belum ada rule timer." />}

        {/* Pagination Footer */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${colors.border['light']}`,
          }}
        >
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

      <TimerFormDialog
        open={formOpen}
        editTarget={editTarget}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Rule"
        description={`Yakin ingin menghapus rule "${RULE_TYPE_LABELS[deleteTarget?.rulesType ?? ''] ?? deleteTarget?.rulesType}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </Box>
  );
}
