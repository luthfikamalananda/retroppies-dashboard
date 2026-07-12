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
import { dashboardApi, type ChartParams, type ChartResult } from '../api/dashboard.api';
import { productsApi } from '../api/products.api';
import { useAuthStore } from '../stores/authStore';
import { DateRangePicker, type DateRange } from '../components/common/DateRangePicker';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { TenantSelector } from '../components/common/TenantSelector';
import { colors } from '../theme/colors';

type Period = 'daily' | 'monthly' | 'annual';

const SUCCESS_COLOR = '#4CAF50';

// ─── Params helper ───────────────────────────────────────────────────────────
function buildParams(
    range: { start: string; end: string },
    tenantId: number,
    productCode: string,
    status: string,
): ChartParams {
    return {
        startDate: range.start,
        endDate: range.end,
        startMonth: dayjs(range.start).format('MM'),
        endMonth: dayjs(range.end).format('MM'),
        startYear: dayjs(range.start).format('YYYY'),
        endYear: dayjs(range.end).format('YYYY'),
        tenantId,
        productCode,
        status,
    };
}

// Normalize the bucket for the selected period into a common {label, value} shape.
// `label` keeps the RAW unique value (date / monthYear / year) so the category axis
// never collapses duplicate ticks — display formatting happens in formatLabel().
function toSeries(result: ChartResult | undefined, period: Period) {
    if (!result) return [];
    if (period === 'daily') return result.daily.map((d) => ({ label: d.date, value: d.total }));
    if (period === 'monthly') return result.monthly.map((m) => ({ label: m.monthYear, value: m.total }));
    return result.annual.map((a) => ({ label: a.year, value: a.total }));
}

// Display formatting: daily → weekday (Monday), monthly → month name (June), annual → year.
function formatLabel(label: string, period: Period): string {
    if (period === 'daily') return dayjs(label).format('dddd');
    if (period === 'monthly') return dayjs(label).format('MMMM');
    return label;
}

function sumDaily(result: ChartResult): number {
    return result.daily.reduce((sum, d) => sum + d.total, 0);
}

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
        { key: 'monthly', label: 'Monthly' },
        { key: 'annual', label: 'Annual' },
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

function ProductSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <FormControl size="small" fullWidth>
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                displayEmpty
                sx={{ fontSize: 13, borderRadius: 1.5 }}
            >
                {options.map((o) => (
                    <SelectItem key={o.value} value={o.value} sx={{ fontSize: 13 }}>
                        {o.label}
                    </SelectItem>
                ))}
            </Select>
        </FormControl>
    );
}

const chartLineStyle = {
    strokeWidth: 2,
    dot: <Dot r={3} />,
    activeDot: { r: 5 },
};

export default function DashboardPage() {
    const activeTenantId = useAuthStore().user?.tenantId ?? 0;

    const [revenuePeriod, setRevenuePeriod] = useState<Period>('daily');
    const [txPeriod, setTxPeriod] = useState<Period>('daily');
    const [revenueDateRange, setRevenueDateRange] = useState<DateRange>({
        start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
    });
    const [txDateRange, setTxDateRange] = useState<DateRange>({
        start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
    });
    const [revenueProduct, setRevenueProduct] = useState('');
    const [txProduct, setTxProduct] = useState('');

    const queryKey = ['dashboard', activeTenantId];

    // ─── Product options (dynamic) ───────────────────────────────────────────
    const productsQuery = useQuery({
        queryKey: ['dashboard-products', activeTenantId],
        queryFn: () =>
            productsApi.list({
                tenantId: activeTenantId,
                keyword: '',
                page: 1,
                limit: 100,
                productType: '',
            }),
    });
    const productOptions = [
        { value: '', label: 'All Product' },
        ...(productsQuery.data?.result.products ?? []).map((p) => ({
            value: p.productCode,
            label: `${p.productName} (${p.productType.toLocaleUpperCase()})`,
        })),
    ];

    // ─── Today's Overview (counts) ───────────────────────────────────────────
    const summaryQuery = useQuery({
        queryKey: [...queryKey, 'summary'],
        queryFn: async () => {
            const today = { start: dayjs().format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') };
            const [all, success] = await Promise.all([
                dashboardApi.getChartCount(buildParams(today, activeTenantId, '', '')),
                dashboardApi.getChartCount(buildParams(today, activeTenantId, '', 'SUCCESS')),
            ]);
            const total = sumDaily(all);
            const successCount = sumDaily(success);
            return {
                total,
                success: successCount,
                failed: total - successCount, // PENDING + FAILED
            };
        },
    });

    // ─── Revenue Analysis (revenue, SUCCESS only) ────────────────────────────
    const revenueQuery = useQuery({
        queryKey: [...queryKey, 'revenue', revenueDateRange, revenueProduct],
        queryFn: () =>
            dashboardApi.getChartSummary(
                buildParams(revenueDateRange, activeTenantId, revenueProduct, 'SUCCESS'),
            ),
    });

    // ─── Transaction Analysis (count, SUCCESS only) ──────────────────────────
    const txChartQuery = useQuery({
        queryKey: [...queryKey, 'txChart', txDateRange, txProduct],
        queryFn: () =>
            dashboardApi.getChartCount(
                buildParams(txDateRange, activeTenantId, txProduct, 'SUCCESS'),
            ),
    });

    const revenueSeries = toSeries(revenueQuery.data, revenuePeriod);
    const txSeries = toSeries(txChartQuery.data, txPeriod);

    const anyError =
        summaryQuery.isError || revenueQuery.isError || txChartQuery.isError;

    return (
        <Box>
            {/* Page title + tenant scope */}
            <FilterToolbar title="Summary">
                <TenantSelector sx={{ width: { xs: '100%', sm: 220 } }} />
            </FilterToolbar>

            {anyError && (
                <ErrorAlert
                    message="Failed to load dashboard data."
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
                            value={summaryQuery.data?.total}
                            loading={summaryQuery.isLoading}
                        />
                        <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: 'none', sm: 'block' } }} />
                        <MetricItem
                            label="Total Transaction Success"
                            value={summaryQuery.data?.success}
                            loading={summaryQuery.isLoading}
                            color={colors.brand[500]}
                        />
                        <Divider orientation="vertical" flexItem sx={{ mx: 3, display: { xs: 'none', sm: 'block' } }} />
                        <MetricItem
                            label="Total Transaction Failed &amp; Expired"
                            value={summaryQuery.data?.failed}
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
                        <DateRangePicker
                            value={revenueDateRange}
                            onChange={setRevenueDateRange}
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
                                    <LineChart data={revenueSeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border['default']} vertical={false} />
                                        <XAxis dataKey="label" tickFormatter={(v: string) => formatLabel(v, revenuePeriod)} tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: colors.base['grey'] }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v: number) => Intl.NumberFormat('id-ID', { notation: 'compact' }).format(v)}
                                        />
                                        <RechartsTooltip
                                            labelFormatter={(v) => formatLabel(String(v ?? ''), revenuePeriod)}
                                            formatter={(v) => Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v))}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={SUCCESS_COLOR}
                                            name="Total Revenue"
                                            {...chartLineStyle}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            {/* Legend */}
                            <Stack direction="row" sx={{ gap: 2, mt: 1 }}>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: SUCCESS_COLOR }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Total Revenue</Typography>
                                </Stack>
                            </Stack>
                        </Grid>

                        {/* Product type filter */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <ProductSelect
                                value={revenueProduct}
                                onChange={setRevenueProduct}
                                options={productOptions}
                            />
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
                        <DateRangePicker
                            value={txDateRange}
                            onChange={setTxDateRange}
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
                                    <LineChart data={txSeries}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border['default']} vertical={false} />
                                        <XAxis dataKey="label" tickFormatter={(v: string) => formatLabel(v, txPeriod)} tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: colors.base['grey'] }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip labelFormatter={(v) => formatLabel(String(v ?? ''), txPeriod)} formatter={(v) => Number(v).toLocaleString('id-ID')} />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={SUCCESS_COLOR}
                                            name="Transaction Success"
                                            {...chartLineStyle}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            <Stack direction="row" sx={{ gap: 2, mt: 1 }}>
                                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: SUCCESS_COLOR }} />
                                    <Typography variant="caption" sx={{ color: colors.base['grey'] }}>Transaction Success</Typography>
                                </Stack>
                            </Stack>
                        </Grid>

                        {/* Product type filter */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <ProductSelect
                                value={txProduct}
                                onChange={setTxProduct}
                                options={productOptions}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
