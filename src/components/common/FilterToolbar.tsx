import { Children, type ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { Box, Stack, Typography } from '@mui/material';
import { colors } from '../../theme/colors';

/**
 * Tinggi seragam untuk SEMUA kontrol filter (search, select, tenant selector,
 * date picker, tombol aksi). Satu token → semua kontrol sejajar sempurna.
 */
export const FILTER_CONTROL_HEIGHT = 40;

/**
 * Style dasar untuk kontrol filter berbasis input (Select, Autocomplete, TextField).
 * Menjamin tinggi & font konsisten. Lebar diatur oleh pemanggil.
 */
export const filterControlSx: SxProps<Theme> = {
    bgcolor: colors.base['white'],
    height: FILTER_CONTROL_HEIGHT,
    '& .MuiInputBase-root': { height: FILTER_CONTROL_HEIGHT, fontSize: 14 },
    '& .MuiInputBase-input': { fontSize: 14 },
};

/**
 * Style dasar untuk tombol aksi utama toolbar (mis. "Add Product").
 * Lebar dibiarkan auto: di mobile menyesuaikan container (stretch),
 * di desktop selebar konten.
 */
export const toolbarButtonSx: SxProps<Theme> = {
    height: FILTER_CONTROL_HEIGHT,
    bgcolor: colors.brand[500],
    '&:hover': { bgcolor: colors.brand[600] },
    textTransform: 'none',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    px: 2.5,
};

/** Cluster kontrol filter — dipakai baik di kanan judul (compact) maupun di baris bawah. */
function FilterCluster({
    children,
    align,
}: {
    children: ReactNode;
    align: 'start' | 'end';
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: { sm: align === 'end' ? 'flex-end' : 'flex-start' },
                flexWrap: { sm: 'wrap' },
                gap: 1.5,
                width: { xs: '100%', md: align === 'end' ? 'auto' : '100%' },
                '& > *': { flexShrink: 0 },
            }}
        >
            {children}
        </Box>
    );
}

interface FilterToolbarProps {
    /** Judul halaman (kiri). */
    title: ReactNode;
    /** Tombol aksi utama — selalu menempel di baris judul (kanan). */
    action?: ReactNode;
    /** Kontrol filter. */
    children?: ReactNode;
    /** sx tambahan untuk wrapper terluar. */
    sx?: SxProps<Theme>;
}

/**
 * Header + baris filter untuk halaman tabel.
 *
 * Aturan layout (sesuai preferensi):
 * - Total kontrol (filter + tombol aksi) ≤ 2  → semua sebaris di kanan judul.
 * - Total kontrol > 2  → judul + tombol aksi di baris atas, SEMUA filter
 *   turun ke satu baris di bawah judul (rata kiri) agar tidak menumpuk di kanan.
 *
 * Kontrol anak sebaiknya memakai {@link filterControlSx} / {@link toolbarButtonSx}
 * dan lebar tetap (mis. `width: { xs: '100%', sm: 220 }`) agar rapi & sejajar.
 */
export function FilterToolbar({ title, action, children, sx }: FilterToolbarProps) {
    const filterCount = Children.toArray(children).length;
    const totalControls = filterCount + (action ? 1 : 0);
    const stacked = totalControls > 2;

    const titleNode =
        typeof title === 'string' ? (
            <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: colors.base['black'], flexShrink: 0 }}
            >
                {title}
            </Typography>
        ) : (
            title
        );

    // > 2 kontrol → filter pindah ke baris bawah judul
    if (stacked) {
        return (
            <Box sx={{ mb: 3, ...sx }}>
                <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: filterCount ? 2 : 0 }}
                >
                    {titleNode}
                    {action}
                </Stack>
                {filterCount > 0 && <FilterCluster align="start">{children}</FilterCluster>}
            </Box>
        );
    }

    // ≤ 2 kontrol → sebaris di kanan judul
    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
                mb: 3,
                ...sx,
            }}
        >
            {titleNode}
            {(filterCount > 0 || action) && (
                <FilterCluster align="end">
                    {children}
                    {action}
                </FilterCluster>
            )}
        </Stack>
    );
}
