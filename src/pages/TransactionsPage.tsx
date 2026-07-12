import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  Dialog,
  Divider,
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
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect, useState } from 'react';
import { transactionsApi, type ItemTransaction } from '../api/transactions.api';
import { DateRangePicker, type DateRange } from '../components/common/DateRangePicker';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { SearchField } from '../components/common/SearchField';
import { TenantSelector } from '../components/common/TenantSelector';
import { usePermissions } from '../hooks/usePermissions';

import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
dayjs.extend(utc);

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const STATUS_STYLES = {
  success: { bg: '#E8F5E9', color: '#2E7D32' },
  failed: { bg: '#FDE8E8', color: colors.error[700] },
} as const;

function getStatusDisplay(status: string) {
  const isSuccess = status.toLowerCase() === 'success';
  return {
    label: isSuccess ? 'Success' : status.toUpperCase(),
    ...(isSuccess ? STATUS_STYLES.success : STATUS_STYLES.failed),
  };
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const activeTenantId = useAuthStore().user?.tenantId ?? 0;
  const { isSuperAdmin } = usePermissions();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // const [statusFilter, setStatusFilter] = useState<'' | 'success' | 'failed'>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  });
  const [selectedTx, setSelectedTx] = useState<ItemTransaction[] | null>(null);
  // const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    // queryKey: ['transactions', activeTenantId, statusFilter, dateRange, debouncedSearch, page, pageSize, sortDir],
    queryKey: ['transactions', activeTenantId, dateRange, debouncedSearch, page, pageSize],
    queryFn: () =>
      transactionsApi.list({
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
        productCode: debouncedSearch,
        tenantId: activeTenantId,
        page,
        limit: pageSize,
      }),
  });

  const rows = data?.result?.trxList ?? [];
  const total = data?.result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toEntry = Math.min(page * pageSize, total);

  const HEADER_CELL = {
    bgcolor: colors.brand[100],
    fontWeight: 600,
    fontSize: 13,
    color: colors.base['black'],
  } as const;

  return (
    <Box>
      {/* Breadcrumb */}
      {/* <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
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
      </Breadcrumbs> */}

      {/* Header */}
      <FilterToolbar title="Report Transactions">
        <TenantSelector sx={{ width: { xs: '100%', sm: 220 } }} />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search product code…"
        />
        <DateRangePicker
          value={dateRange}
          onChange={(r) => { setDateRange(r); setPage(1); }}
        />
      </FilterToolbar>

      {isError && <ErrorAlert onRetry={refetch} />}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border['default']}`, boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...HEADER_CELL, width: 80 }}>#</TableCell>
                {isSuperAdmin && <TableCell sx={{ bgcolor: colors.brand[100], fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>Tenant</TableCell>}
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>Transaction Code</TableCell>
                {/* <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                    Invoice Number
                    <UnfoldMoreIcon
                      sx={{ fontSize: 16, cursor: 'pointer', color: colors.base['grey'] }}
                      onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                    />
                  </Stack>
                </TableCell> */}
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>Price</TableCell>
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>Amount</TableCell>
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, justifyContent: 'center', textAlign: "center" }}>
                    Grand Total
                    {/* <UnfoldMoreIcon sx={{ fontSize: 16, color: colors.base['grey'] }} /> */}
                  </Stack>
                </TableCell>
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>Transaction Date</TableCell>
                <TableCell sx={{ ...HEADER_CELL, textAlign: 'center' }}>Status</TableCell>
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
                : rows.map((tx, idx) => {
                  const status = getStatusDisplay(tx.status);
                  return (
                  <TableRow
                    key={tx.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: colors.base['background-light'] } }}
                    onClick={() => setSelectedTx(tx.items)}
                  >
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'] }}>
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    {isSuperAdmin && <TableCell sx={{ fontWeight: 600, fontSize: 13, color: colors.base['black'] }}>{tx.tenantName}</TableCell>}
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], fontWeight: 500, textAlign: 'center' }}>
                      {tx.invoiceNumber}
                    </TableCell>
                    {/* <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={tx.id}
                        size="small"
                        sx={{
                          bgcolor: colors.base['section'],
                          color: colors.base['black'],
                          fontWeight: 600,
                          fontSize: 11,
                          fontFamily: 'monospace',
                          borderRadius: 1,
                        }}
                      />
                    </TableCell> */}
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.grandTotal)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center' }}>
                      {tx.items.length}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center', fontWeight: 600 }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.grandTotal)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: colors.base['black'], textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {dayjs.utc(tx.transactionDate).format('DD/MM/YYYY HH:mm:ss')}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{
                          bgcolor: status.bg,
                          color: status.color,
                          fontWeight: 600,
                          fontSize: 12,
                          borderRadius: 1,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {!isLoading && rows.length === 0 && (
          <EmptyState message="Tidak ada transaksi untuk filter ini." />
        )}

        {/* Pagination Footer */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ alignItems: 'center', gap: 1, px: 2, py: 1.5, borderTop: `1px solid ${colors.border['light']}` }}
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
      <Dialog
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        slotProps={{ paper: { sx: { width: { xs: '100vw', sm: 380 }, px: 3, py: 2 } } }}
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
          selectedTx.map((item) => (
            <Box key={item.id} sx={{ mb: 2, p: 2, border: `1px solid ${colors.border['default']}`, borderRadius: 2 }}>
              <Typography sx={{ fontSize: 13, color: colors.base['black'], fontWeight: 500 }}>
                {item.productName} ({item.productCode})
              </Typography>
              <Stack direction="row" sx={{ mt: 1, gap: 2 }}>
                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>Price:</Typography>
                <Typography sx={{ fontSize: 12, color: colors.base['black'], fontWeight: 500 }}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ mt: 0.5, gap: 2 }}>
                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>Amount:</Typography>
                <Typography sx={{ fontSize: 12, color: colors.base['black'], fontWeight: 500 }}>
                  {item.qty}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ mt: 0.5, gap: 2 }}>
                <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>Subtotal:</Typography>
                <Typography sx={{ fontSize: 12, color: colors.base['black'], fontWeight: 500 }}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.subtotal)}
                </Typography>
              </Stack>
            </Box>
          ))
          // <Stack sx={{ gap: 2 }}>
          //   {([
          //     { label: 'Product Code', value: selectedTx.productCode ?? '—' },
          //     { label: 'Product Name', value: selectedTx.productName ?? '—' },
          //     { label: 'Price', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedTx.price) ?? 0 },
          //     { label: 'Amount', value: selectedTx.qty ?? '—' },
          //     { label: 'Subtotal', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedTx.subtotal) ?? 0 },
          //   ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
          //     <Box key={label}>
          //       <Typography sx={{ fontSize: 12, color: colors.base['grey'] }}>{label}</Typography>
          //       <Typography sx={{ fontWeight: 500, mt: 0.25, fontSize: 14, color: colors.base['black'] }}>
          //         {value}
          //       </Typography>
          //     </Box>
          //   ))}
          // </Stack>
        )}
      </Dialog>
    </Box>
  );
}