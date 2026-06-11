import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Popover,
  Select,
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
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useEffect, useState } from 'react';
import { transactionsApi, type ItemTransaction } from '../api/transactions.api';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { usePermissions } from '../hooks/usePermissions';

import { colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
dayjs.extend(utc);

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── Dual-month date range picker ──────────────────────────────────────────

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

interface CalendarMonthProps {
  viewMonth: Dayjs;
  rangeStart: Dayjs | null;
  rangeEnd: Dayjs | null;
  hovered: Dayjs | null;
  onSelectDay: (d: Dayjs) => void;
  onHoverDay: (d: Dayjs | null) => void;
}

function CalendarMonth({ viewMonth, rangeStart, rangeEnd, hovered, onSelectDay, onHoverDay }: CalendarMonthProps) {
  const firstDay = viewMonth.startOf('month');
  // Monday-based: 0=Mo … 6=Su
  const startOffset = (firstDay.day() + 6) % 7;
  const daysInMonth = viewMonth.daysInMonth();

  const cells: (Dayjs | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDay.add(i, 'day')),
  ];

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const effectiveEnd = rangeEnd ?? hovered;

  function isInRange(d: Dayjs) {
    if (!rangeStart || !effectiveEnd) return false;
    const [s, e] = rangeStart.isBefore(effectiveEnd)
      ? [rangeStart, effectiveEnd]
      : [effectiveEnd, rangeStart];
    return (d.isAfter(s) || d.isSame(s, 'day')) && (d.isBefore(e) || d.isSame(e, 'day'));
  }

  function isStart(d: Dayjs) {
    if (!rangeStart) return false;
    if (!effectiveEnd) return d.isSame(rangeStart, 'day');
    const [s] = rangeStart.isBefore(effectiveEnd) ? [rangeStart] : [effectiveEnd];
    return d.isSame(s, 'day');
  }

  function isEnd(d: Dayjs) {
    if (!rangeStart || !effectiveEnd) return false;
    const [, e] = rangeStart.isBefore(effectiveEnd) ? [rangeStart, effectiveEnd] : [effectiveEnd, rangeStart];
    return d.isSame(e, 'day');
  }

  return (
    <Box sx={{ width: 280 }}>
      {/* Weekday headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAYS.map((w) => (
          <Typography key={w} sx={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: colors.base['grey'], py: 0.5 }}>
            {w}
          </Typography>
        ))}
      </Box>
      {/* Days */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          if (!d) return <Box key={i} />;

          const start = isStart(d);
          const end = isEnd(d);
          const inRange = isInRange(d);
          const isToday = d.isSame(dayjs(), 'day');

          return (
            <Box
              key={i}
              onClick={() => onSelectDay(d)}
              onMouseEnter={() => onHoverDay(d)}
              onMouseLeave={() => onHoverDay(null)}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 36,
                cursor: 'pointer',
                // Range background (half-width left or right to bridge between cells)
                '&::before': inRange && !start && !end ? {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  bgcolor: colors.brand[100],
                } : {},
                '&::after': (start || end) && inRange ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: start ? '50%' : 0,
                  right: end ? '50%' : 0,
                  bgcolor: colors.brand[100],
                } : {},
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: start || end ? colors.brand[600] : inRange ? colors.brand[100] : 'transparent',
                  color: start || end ? '#fff' : inRange ? colors.brand[700] : isToday ? colors.brand[600] : colors.base['black'],
                  fontWeight: start || end || isToday ? 700 : 400,
                  fontSize: 13,
                  '&:hover': {
                    bgcolor: start || end ? colors.brand[700] : colors.brand[200],
                  },
                  transition: 'background-color 0.15s',
                }}
              >
                {d.date()}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (r: DateRange) => void;
}

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [leftMonth, setLeftMonth] = useState<Dayjs>(dayjs(value.start).startOf('month'));
  const [picking, setPicking] = useState<Dayjs | null>(null); // first click
  const [hovered, setHovered] = useState<Dayjs | null>(null);
  const rightMonth = leftMonth.add(1, 'month');

  // const rangeStart = picking ?? (value.start ? dayjs(value.start) : null);
  // const rangeEnd = !picking && value.end ? dayjs(value.end) : null;

  function handleSelectDay(d: Dayjs) {
    if (!picking) {
      // First click: start new range
      setPicking(d);
    } else {
      // Second click: confirm range
      const [s, e] = d.isBefore(picking) ? [d, picking] : [picking, d];
      onChange({ start: s.format('YYYY-MM-DD'), end: e.format('YYYY-MM-DD') });
      setPicking(null);
      setAnchorEl(null);
    }
  }

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setLeftMonth(dayjs(value.start).startOf('month'));
    setPicking(null);
    setAnchorEl(e.currentTarget);
  }

  const displayLabel = value.start && value.end
    ? `${dayjs(value.start).format('DD MMM YYYY')} - ${dayjs(value.end).format('DD MMM YYYY')}`
    : 'Pilih tanggal';

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outlined"
        size="small"
        endIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
        sx={{
          height: 40,
          fontSize: 13,
          fontWeight: 500,
          color: colors.base['black'],
          borderColor: colors.border['default'],
          bgcolor: colors.base['white'],
          textTransform: 'none',
          px: 1.5,
          whiteSpace: 'nowrap',
          '&:hover': { borderColor: colors.brand[400], bgcolor: colors.base['white'] },
        }}
      >
        {displayLabel}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => { setAnchorEl(null); setPicking(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', p: 2.5 } } }}
      >
        <Stack direction="row" sx={{ gap: 3 }}>
          {/* Left month */}
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <IconButton size="small" onClick={() => setLeftMonth(leftMonth.subtract(1, 'month'))}>
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: colors.base['black'] }}>
                {leftMonth.format('MMMM')}
                <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: colors.brand[600], ml: 0.5 }}>
                  {leftMonth.format('YYYY')}
                </Typography>
              </Typography>
              <Box sx={{ width: 28 }} /> {/* spacer */}
            </Stack>
            <CalendarMonth
              viewMonth={leftMonth}
              rangeStart={picking ?? (value.start ? dayjs(value.start) : null)}
              rangeEnd={picking ? null : (value.end ? dayjs(value.end) : null)}
              hovered={picking ? hovered : null}
              onSelectDay={handleSelectDay}
              onHoverDay={setHovered}
            />
          </Box>

          {/* Right month */}
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ width: 28 }} /> {/* spacer */}
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: colors.base['black'] }}>
                {rightMonth.format('MMMM')}
                <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, color: colors.brand[600], ml: 0.5 }}>
                  {rightMonth.format('YYYY')}
                </Typography>
              </Typography>
              <IconButton size="small" onClick={() => setLeftMonth(leftMonth.add(1, 'month'))}>
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
            <CalendarMonth
              viewMonth={rightMonth}
              rangeStart={picking ?? (value.start ? dayjs(value.start) : null)}
              rangeEnd={picking ? null : (value.end ? dayjs(value.end) : null)}
              hovered={picking ? hovered : null}
              onSelectDay={handleSelectDay}
              onHoverDay={setHovered}
            />
          </Box>
        </Stack>

        {picking && (
          <Typography sx={{ fontSize: 12, color: colors.base['grey'], mt: 1.5, textAlign: 'center' }}>
            Pilih tanggal akhir
          </Typography>
        )}
      </Popover>
    </>
  );
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
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, width: "100%", gap: 2 }}
      >
        <Stack sx={{ width: "40%", justifyContent: "flex-end" }} >
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.base['black'] }}>
            Laporan Transaksi
          </Typography>
        </Stack>

        <Stack
          direction="row"
          sx={{
            width: "100%",
            gap: 1.5,
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >

          <TextField
            size="small"
            placeholder="Keyword..."
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
              width: { xs: '30%' },
              bgcolor: colors.base['white']
            }}
          />

          <DateRangePicker
            value={dateRange}
            onChange={(r) => { setDateRange(r); setPage(1); }}
          />

          {/* <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
            sx={{ width: 140, bgcolor: colors.base['white'] }}
          >
            <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
            <MenuItem value="success" sx={{ fontSize: 13 }}>Berhasil</MenuItem>
            <MenuItem value="failed" sx={{ fontSize: 13 }}>Gagal</MenuItem>
          </TextField> */}
        </Stack>
      </Stack>

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
                : rows.map((tx, idx) => (
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
                        label={tx.status === 'success' ? 'Success' : 'Failed'}
                        size="small"
                        sx={{
                          bgcolor: tx.status === 'success' ? '#E8F5E9' : '#FDE8E8',
                          color: tx.status === 'success' ? '#2E7D32' : '#B23E3E',
                          fontWeight: 600,
                          fontSize: 12,
                          borderRadius: 1,
                        }}
                      />
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