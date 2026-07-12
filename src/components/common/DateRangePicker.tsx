import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, IconButton, Popover, Stack, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import { colors } from '../../theme/colors';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export interface DateRange {
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

    const today = dayjs().endOf('day');
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
                    const disabled = d.isAfter(today);

                    return (
                        <Box
                            key={i}
                            onClick={() => !disabled && onSelectDay(d)}
                            onMouseEnter={() => !disabled && onHoverDay(d)}
                            onMouseLeave={() => onHoverDay(null)}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 36,
                                cursor: disabled ? 'not-allowed' : 'pointer',
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
                                    color: disabled
                                        ? colors.border['default']
                                        : start || end ? '#fff' : inRange ? colors.brand[700] : isToday ? colors.brand[600] : colors.base['black'],
                                    fontWeight: start || end || isToday ? 700 : 400,
                                    fontSize: 13,
                                    '&:hover': {
                                        bgcolor: disabled ? 'transparent' : start || end ? colors.brand[700] : colors.brand[200],
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

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [leftMonth, setLeftMonth] = useState<Dayjs>(dayjs(value.start).startOf('month'));
    const [picking, setPicking] = useState<Dayjs | null>(null); // first click
    const [hovered, setHovered] = useState<Dayjs | null>(null);
    const rightMonth = leftMonth.add(1, 'month');
    const isAtCurrentMonth = rightMonth.isSame(dayjs(), 'month') || rightMonth.isAfter(dayjs(), 'month');

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
                    flexShrink: 0,
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: 'space-between',
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
                            <IconButton
                                size="small"
                                disabled={isAtCurrentMonth}
                                onClick={() => setLeftMonth(leftMonth.add(1, 'month'))}
                            >
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
