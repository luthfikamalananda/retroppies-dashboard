import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Select,
  MenuItem,
  Drawer,
  Divider,
  Breadcrumbs,
  Link,
  Skeleton,
  Pagination,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { transactionsApi, type Transaction } from '../api/transactions.api';
import { useScopeStore } from '../stores/scopeStore';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { DateRangeFilter } from '../features/dashboard/DateRangeFilter';
import { colors } from '../theme/colors';
import { TenantSelector } from '../components/common/TenantSelector';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function TransactionsPage() {
  const { activeTenantId } = useScopeStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'success' | 'failed'>('');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions', activeTenantId, statusFilter, dateRange, debouncedSearch, page, pageSize],
    queryFn: () =>
      transactionsApi.list({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
        productCode: debouncedSearch,
        tenantId: activeTenantId ,
        page,
        limit: pageSize
      }),
  });

  const rows = data?.result?.trxList ?? [];
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
          Laporan Transaksi
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
          Laporan Transaksi
        </Typography>
        <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TenantSelector />
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
          <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            sx={{ width: 140, bgcolor: colors.base['white'] }}
          >
            <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
            <MenuItem value="success" sx={{ fontSize: 13 }}>Berhasil</MenuItem>
            <MenuItem value="failed" sx={{ fontSize: 13 }}>Gagal</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      {isError && <ErrorAlert onRetry={refetch} />}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.base['section'] }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>ID Transaksi</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Produk</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Metode Bayar</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Outlet</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'right' }}>Nominal</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>Waktu</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
                : rows.map((tx, idx) => (
                  <TableRow
                    key={tx.transaction_id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: colors.base['background-light'] } }}
                    onClick={() => setSelectedTx(tx)}
                  >
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', color: colors.base['black'] }}>
                      {tx.transaction_id}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{tx.product}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{tx.payment_method ?? '—'}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>{tx.outlet ?? '—'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={tx.status === 'success' ? 'Berhasil' : 'Gagal'}
                        size="small"
                        sx={{
                          bgcolor: tx.status === 'success' ? colors.brand[100] : colors.error[100],
                          color: tx.status === 'success' ? colors.brand[600] : colors.error[600],
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'right' }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {dayjs.utc(tx.date_time).format('DD MMM YYYY HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!isLoading && rows.length === 0 && (
          <EmptyState message="Tidak ada transaksi untuk filter ini." />
        )}

        {/* Pagination Footer */}
        <Stack
          direction="row"
          sx={{ alignItems: 'center', px: 2, py: 1.5, borderTop: `1px solid ${colors.border['light']}` }}
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

      {/* Transaction detail drawer */}
      <Drawer
        anchor="right"
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 360 }, p: 3 } } }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: colors.base['black'] }}>
            Detail Transaksi
          </Typography>
          <IconButton onClick={() => setSelectedTx(null)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {selectedTx && (
          <Stack sx={{ gap: 2 }}>
            {([
              { label: 'ID Transaksi', value: selectedTx.transaction_id },
              { label: 'Waktu', value: dayjs.utc(selectedTx.date_time).format('DD MMMM YYYY, HH:mm:ss') },
              { label: 'Produk', value: selectedTx.product },
              { label: 'Metode Pembayaran', value: selectedTx.payment_method ?? '—' },
              { label: 'Outlet', value: selectedTx.outlet ?? '—' },
              {
                label: 'Status', value: (
                  <Chip
                    label={selectedTx.status === 'success' ? 'Berhasil' : 'Gagal'}
                    size="small"
                    sx={{
                      bgcolor: selectedTx.status === 'success' ? colors.brand[100] : colors.error[100],
                      color: selectedTx.status === 'success' ? colors.brand[600] : colors.error[600],
                      fontWeight: 600,
                    }}
                  />
                ),
              },
              {
                label: 'Nominal',
                value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedTx.amount),
              },
            ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>{label}</Typography>
                <Typography sx={{ fontWeight: 500, mt: 0.25, fontSize: 14, color: colors.base['black'] }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
