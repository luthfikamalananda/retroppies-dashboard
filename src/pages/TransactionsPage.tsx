import React, { useState } from 'react';
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
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  Drawer,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { transactionsApi, type Transaction } from '../api/transactions.api';
import { useScopeStore } from '../stores/scopeStore';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { DateRangeFilter } from '../features/dashboard/DateRangeFilter';

export default function TransactionsPage() {
  const { activeTenantId, activeOutletId } = useScopeStore();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<'' | 'success' | 'failed'>('');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const queryKey = [
    'transactions',
    activeTenantId,
    activeOutletId,
    statusFilter,
    dateRange,
    page,
    pageSize,
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      transactionsApi.list({
        date_start: dateRange.start,
        date_end: dateRange.end,
        status: statusFilter || undefined,
        outlet: activeOutletId ?? undefined,
        page: page + 1,
        page_size: pageSize,
        sort: 'desc',
      }),
  });

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Laporan Transaksi
        </Typography>
        <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(0); }} />
      </Stack>

      <Stack direction="row" sx={{ gap: 2, mb: 2 }}>
        <TextField
          select
          label="Status"
          size="small"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(0);
          }}
          sx={{ width: 150 }}
        >
          <MenuItem value="">Semua</MenuItem>
          <MenuItem value="success">Berhasil</MenuItem>
          <MenuItem value="failed">Gagal</MenuItem>
        </TextField>
      </Stack>

      {isError && <ErrorAlert onRetry={refetch} />}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID Transaksi</TableCell>
                <TableCell>Waktu</TableCell>
                <TableCell>Produk</TableCell>
                <TableCell>Metode Bayar</TableCell>
                <TableCell>Outlet</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Nominal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data?.data.map((tx) => (
                    <TableRow
                      key={tx.transaction_id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTx(tx)}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {tx.transaction_id}
                      </TableCell>
                      <TableCell>
                        {dayjs(tx.date_time).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell>{tx.product}</TableCell>
                      <TableCell>{tx.payment_method ?? '—'}</TableCell>
                      <TableCell>{tx.outlet ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status === 'success' ? 'Berhasil' : 'Gagal'}
                          size="small"
                          color={tx.status === 'success' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!isLoading && data?.data.length === 0 && (
          <EmptyState message="Tidak ada transaksi untuk filter ini." />
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

      {/* Transaction detail drawer */}
      <Drawer
        anchor="right"
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        slotProps={{ paper: { sx: { width: 360, p: 3 } } }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Detail Transaksi
          </Typography>
          <IconButton onClick={() => setSelectedTx(null)} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {selectedTx && (
          <Stack sx={{ gap: 2 }}>
            {[
              { label: 'ID Transaksi', value: selectedTx.transaction_id },
              {
                label: 'Waktu',
                value: dayjs(selectedTx.date_time).format('DD MMMM YYYY, HH:mm:ss'),
              },
              { label: 'Produk', value: selectedTx.product },
              { label: 'Metode Pembayaran', value: selectedTx.payment_method ?? '—' },
              { label: 'Outlet', value: selectedTx.outlet ?? '—' },
              {
                label: 'Status',
                value: (
                  <Chip
                    label={selectedTx.status === 'success' ? 'Berhasil' : 'Gagal'}
                    size="small"
                    color={selectedTx.status === 'success' ? 'success' : 'error'}
                  />
                ),
              },
              {
                label: 'Nominal',
                value: new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(selectedTx.amount),
              },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography sx={{ fontWeight: 500, mt: 0.25 }}>
                  {value as React.ReactNode}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}
