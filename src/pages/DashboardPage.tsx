import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Skeleton,
    Stack,
    Button,
    ButtonGroup,
    Select,
    MenuItem as SelectItem,
    FormControl,
    Divider,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Dot,
} from 'recharts';
import dayjs from 'dayjs';
import { dashboardApi } from '../api/dashboard.api';
import { useScopeStore } from '../stores/scopeStore';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { colors } from '../theme/colors';

type Period = 'daily' | 'weekly' | 'monthly';

function MetricItem({
    label,
    value,
    loading,
    color,
}: {
    label: string;
    value?: number;
    loading: boolean;
    color?: string;
}) {
    return (
        <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: colors.base['grey'], mb: 0.5 }}>
                {label}
            </Typography>
            {loading ? (
                <Skeleton width={60} height={36} />
            ) : (
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: color ?? colors.base['black'] }}
                >
                    {value?.toLocaleString('id-ID') ?? '—'}
                </Typography>
            )}
        </Box>
    );
}

function PeriodTabs({
    value,
    onChange,
}: {
    value: Period;
    onChange: (p: Period) => void;
}) {
    const tabs: { key: Period; label: string }[] = [
        { key: 'daily', label: 'Daily' },
        { key: 'weekly', label: 'Weekly' },
        { key: 'monthly', label: 'Monthly' },
    ];
    return (
        <ButtonGroup size="small" disableElevation>
            {tabs.map((t) => (
                <Button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    variant={value === t.key ? 'contained' : 'outlined'}
                    sx={
                        value === t.key
                            ? {
                                bgcolor: colors.brand[500],
                                color: colors.base['white'],
                                borderColor: colors.brand[500],
                                '&:hover': { bgcolor: colors.brand[600] },
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                              }
                            : {
                                bgcolor: 'transparent',
                                color: colors.base['black'],
                                borderColor: colors.border['default'],
                                '&:hover': { borderColor: colors.border['hover'], bgcolor: colors.base['background-light'] },
                                textTransform: 'none',
                                fontWeight: 400,
                                px: 2,
                              }
                    }
                >
                    {t.label}
                </Button>
            ))}
        </ButtonGroup>
    );
}

function DateRangeBar({
    start,
    end,
    onStartChange,
    onEndChange,
}: {
    start: string;
    end: string;
    onStartChange: (v: string) => void;
    onEndChange: (v: string) => void;
}) {
    const label = `${dayjs(start).format('D MMMM')} - ${dayjs(end).format('D MMMM YYYY')}`;
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                border: '1px solid',
                borderColor: colors.border['default'],
                borderRadius: 1.5,
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                position: 'relative',
            }}
        >
            <Typography variant="body2" sx={{ color: colors.base['black'], mr: 0.5 }}>
                {label}
            </Typography>
            <CalendarTodayIcon sx={{ fontSize: 16, color: colors.brand[500] }} />
            {/* Hidden date inputs for now — can be replaced with a date-range picker */}
            <Box
                component="input"
                type="date"
                value={start}
                onChange={(e) => onStartChange((e.target as HTMLInputElement).value)}
                sx={{ position: 'absolute', opacity: 0, width: '50%', left: 0, top: 0, bottom: 0, cursor: 'pointer' }}
            />
            <Box
                component="input"
                type="date"
                value={end}
                onChange={(e) => onEndChange((e.target as HTMLInputElement).value)}
                sx={{ position: 'absolute', opacity: 0, width: '50%', right: 0, top: 0, bottom: 0, cursor: 'pointer' }}
            />
        </Box>
    );
}

const PRODUCT_OPTIONS = [
    { value: 'all', label: 'All Type Product' },
    { value: 'photostrip', label: 'Photostrip Only' },
    { value: 'photo_cd', label: 'Photo + CD Keychain' },
    { value: 'photo_beverage', label: 'Photo + Beverage' },
];

export default function DashboardPage() {
    const { activeTenantId, activeOutletId } = useScopeStore();

    const [revenuePeriod, setRevenuePeriod] = useState<Period>('weekly');
    const [txPeriod, setTxPeriod] = useState<Period>('weekly');
    const [revenueDateRange, setRevenueDateRange] = useState({
        start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
    });
    const [txDateRange, setTxDateRange] = useState({
        start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
    });
    const [revenueProduct, setRevenueProduct] = useState('photostrip');
    const [txProduct, setTxProduct] = useState('all');

    const baseParams = { outlet_id: activeOutletId ?? undefined };
    const queryKey = ['dashboard', activeTenantId, activeOutletId];

    const summaryQuery = useQuery({
        queryKey: [...queryKey, 'summary'],
        queryFn: () =>
            dashboardApi.getSummary({
                ...baseParams,
                date_start: dayjs().format('YYYY-MM-DD'),
                date_end: dayjs().format('YYYY-MM-DD'),
            }),
        enabled: !!activeTenantId,
    });

    const revenueQuery = useQuery({
        queryKey: [...queryKey, 'revenue', revenuePeriod, revenueDateRange, revenueProduct],
        queryFn: () =>
            dashboardApi.getRevenueChart({
                ...baseParams,
                date_start: revenueDateRange.start,
                date_end: revenueDateRange.end,
            }),
        enabled: !!activeTenantId,
    });

    const txChartQuery = useQuery({
        queryKey: [...queryKey, 'txChart', txPeriod, txDateRange, txProduct],
        queryFn: () =>
            dashboardApi.getTransactionChart({
                ...baseParams,
                date_start: txDateRange.start,
                date_end: txDateRange.end,
            }),
        enabled: !!activeTenantId,
    });

    const anyError =
        summaryQuery.isError || revenueQuery.isError || txChartQuery.isError;

    const chartLineStyle = {
        strokeWidth: 2,
        dot: <Dot r={3} />,
        activeDot: { r: 5 },
    };

    return (
        <Box>
            {/* Page title */}
            <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: colors.base['black'], mb: 3 }}
            >
                Summary
            </Typography>

            {anyError && (
                <ErrorAlert
                    message="Gagal memuat data dashboard."
                    onRetry={() => {
                        summaryQuery.refetch();
                        revenueQuery.refetch();
                        txChartQuery.refetch();
                    }}
                />
            )}

            {/* Today's Overview */}
            <Card
                sx={{
                    mb: 3,
                    border: '1px solid',
                    borderColor: colors.border['light'],
                    boxShadow: 'none',
                    borderRadius: 2,
                }}
            >
                <CardContent sx={{ py: 2.5 }}>
                    <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: colors.base['black'], mb: 2 }}
                    >
                        Today's Overview
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 0 }}>
                        <MetricItem
                            label="Total Transaction"
                            value={summaryQuery.data?.total_transactions}
                            loading={summaryQuery.isLoading}
                        />
                        <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: 'none', sm: 'block' } }} />
                        <MetricItem
                            label="Total Transaction Success"
                            value={summaryQuery.data?.success_transactions}
                            loading={summaryQuery.isLoading}
                            color={colors.brand[500]}
                        />
                        <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: 'none', sm: 'block' } }} />
                        <MetricItem
                            label="Total Transaction Failed &amp; Expired"
                            value={summaryQuery.data?.failed_transactions}
                            loading={summaryQuery.isLoading}
                            color={colors.brand[500]}
                        />
                    </Stack>
                </CardContent>
            </Card>

            {/* Revenue Analysis */}
            <Card
                sx={{
                    mb: 3,
                    border: '1px solid',
                    borderColor: colors.border['light'],
                    boxShadow: 'none',
                    borderRadius: 2,
                }}
            >
                <CardContent>
                    {/* Controls row */}
                    <Stack direction="row" sx={{ alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                        <PeriodTabs value={revenuePeriod} onChange={setRevenuePeriod} />
                        <Box sx={{ flex: 1 }} />
                        <DateRangeBar
                            start={revenueDateRange.start}
                            end={revenueDateRange.end}
                            onStartChange={(v) => setRevenueDateRange((r) => ({ ...r, start: v }))}
                            onEndChange={(v) => setRevenueDateRange((r) => ({ ...r, end: v }))}
                        />
                    </Stack>

                    {/* Chart + legend row */}
                    <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
                        <Grid size={{ xs: 12, md: 9 }}>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, color: colors.base['black'], mb: 1.5 }}
                            >
                                Revenue Analysis
                            </Typography>
                            {revenueQuery.isLoading ? (
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={revenueQuery.data ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border['default']} vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="success"
                                            stroke="#4CAF50"
                                            name="Transaction Success"
                                            {...chartLineStyle}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="failed"
                                            stroke={colors.brand[500]}
                                            name="Transaction Failed"
                                            {...chartLineStyle}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            {/* Legend */}
                            <Stack direction="row" sx={{ gap: 2, mt: 1 }}>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Transaction Success</Typography>
                                </Stack>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.brand[500] }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Transaction Failed</Typography>
                                </Stack>
                                <Box sx={{ flex: 1 }} />
                                <Typography variant="caption" sx={{ color: colors.base['grey'] }}>
                                    Compared to Last week
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Product type filter */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={revenueProduct}
                                    onChange={(e) => setRevenueProduct(e.target.value)}
                                    sx={{ fontSize: 13, borderRadius: 1.5 }}
                                >
                                    {PRODUCT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Product type legend checkboxes (visual only) */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.base['black'], display: 'block', mb: 1 }}>
                                    Product Type
                                </Typography>
                                {['Retroppies Photo', 'Photo + CD Keychain', 'Photo + Beverage'].map((p) => (
                                    <Stack key={p} direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.75 }}>
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                border: '1.5px solid',
                                                borderColor: colors.border['default'],
                                                borderRadius: 0.5,
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: colors.base['black'] }}>
                                            {p}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Transaction Analysis */}
            <Card
                sx={{
                    border: '1px solid',
                    borderColor: colors.border['light'],
                    boxShadow: 'none',
                    borderRadius: 2,
                }}
            >
                <CardContent>
                    {/* Controls row */}
                    <Stack direction="row" sx={{ alignItems: 'center', mb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                        <PeriodTabs value={txPeriod} onChange={setTxPeriod} />
                        <Box sx={{ flex: 1 }} />
                        <DateRangeBar
                            start={txDateRange.start}
                            end={txDateRange.end}
                            onStartChange={(v) => setTxDateRange((r) => ({ ...r, start: v }))}
                            onEndChange={(v) => setTxDateRange((r) => ({ ...r, end: v }))}
                        />
                    </Stack>

                    <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
                        <Grid size={{ xs: 12, md: 9 }}>
                            <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, color: colors.base['black'], mb: 1.5 }}
                            >
                                Transaction Analysis
                            </Typography>
                            {txChartQuery.isLoading ? (
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={txChartQuery.data ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border['default']} vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="success"
                                            stroke="#4CAF50"
                                            name="Transaction Success"
                                            {...chartLineStyle}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="failed"
                                            stroke={colors.brand[500]}
                                            name="Transaction Failed"
                                            {...chartLineStyle}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            <Stack direction="row" sx={{ gap: 2, mt: 1 }}>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Transaction Success</Typography>
                                </Stack>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors.brand[500] }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Transaction Failed</Typography>
                                </Stack>
                                <Box sx={{ flex: 1 }} />
                                <Typography variant="caption" sx={{ color: colors.base['grey'] }}>
                                    Compared to Last week
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Product type filter */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl size="small" fullWidth>
                                <Select
                                    value={txProduct}
                                    onChange={(e) => setTxProduct(e.target.value)}
                                    sx={{ fontSize: 13, borderRadius: 1.5 }}
                                >
                                    {PRODUCT_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
