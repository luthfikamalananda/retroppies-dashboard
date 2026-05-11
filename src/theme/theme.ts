import { createTheme } from '@mui/material/styles';
import type { BaseColorScale, BorderColorScale, ColorScale } from './colors';

// ─── Custom Typography Variants ───────────────────────────────────────────────
//  Mendaftarkan variant baru ke tipe MUI Typography
declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        // Title — 3 ukuran, beda di fontSize saja
        titleLg: true;
        titleMd: true;
        titleSm: true;
        // Body — 5 ukuran
        bodyXl: true;
        bodyLg: true;
        bodyMd: true;
        bodySm: true;
        bodyXs: true;
    }
}

// Mendaftarkan ke theme.typography agar bisa diisi nilainya di createTheme
declare module '@mui/material/styles' {
    interface TypographyVariants {
        titleLg: React.CSSProperties;
        titleMd: React.CSSProperties;
        titleSm: React.CSSProperties;
        bodyXl: React.CSSProperties;
        bodyLg: React.CSSProperties;
        bodyMd: React.CSSProperties;
        bodySm: React.CSSProperties;
        bodyXs: React.CSSProperties;
    }
    interface TypographyVariantsOptions {
        titleLg?: React.CSSProperties;
        titleMd?: React.CSSProperties;
        titleSm?: React.CSSProperties;
        bodyXl?: React.CSSProperties;
        bodyLg?: React.CSSProperties;
        bodyMd?: React.CSSProperties;
        bodySm?: React.CSSProperties;
        bodyXs?: React.CSSProperties;
    }
}
import {
    brandColor,
    baseColor,
    borderColor,
    secondaryColor,
    accentColor,
    woodToneColor,
    highlightColor,
    errorColor,
} from './colors';

// ─── TypeScript Augmentation ──────────────────────────────────────────────────
//  Menambahkan grup warna custom ke tipe MUI Palette
//  Sehingga theme.palette.brand[500] aman secara TypeScript
declare module '@mui/material/styles' {
    interface Palette {
        brand: ColorScale;
        base: ColorScale;
        border: ColorScale;
        accent: ColorScale;
        woodTone: ColorScale;
        highlight: ColorScale;
    }
    interface PaletteOptions {
        brand?: Partial<ColorScale>;
        base?: Partial<BaseColorScale>;
        border?: Partial<BorderColorScale>;
        accent?: Partial<ColorScale>;
        woodTone?: Partial<ColorScale>;
        highlight?: Partial<ColorScale>;
    }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
    // ── Palette ────────────────────────────────────────────────────────────────
    palette: {
        // MUI standard — otomatis generate light/dark/contrastText
        primary: {
            light: brandColor[300],
            main: brandColor[500],
            dark: brandColor[700],
        },
        secondary: {
            light: secondaryColor[300],
            main: secondaryColor[500],
            dark: secondaryColor[700],
        },
        error: {
            light: errorColor[300],
            main: errorColor[500],
            dark: errorColor[700],
        },
        background: {
            default: baseColor['background-light'],  // latar halaman
            paper: baseColor['white'],               // latar card/modal
        },
        text: {
            primary: baseColor["black"],
            secondary: baseColor["grey"],
            disabled: baseColor["grey"],
        },
        divider: borderColor['default'],

        // Custom scales — akses via theme.palette.brand[500], dll.
        brand: brandColor,
        base: baseColor,
        border: borderColor,
        accent: accentColor,
        woodTone: woodToneColor,
        highlight: highlightColor,
    },

    // ── Typography ─────────────────────────────────────────────────────────────
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },

        // ── Title (3 ukuran — beda fontSize saja) ────────────────────────────────
        //  Default: fontWeight semibold, tight line-height, cocok untuk heading
        titleLg: { fontSize: '32px', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' },
        titleMd: { fontSize: '24px', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
        titleSm: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4, letterSpacing: '0em' },

        // ── Body (5 ukuran — fontWeight regular, line-height longgar) ─────────────
        bodyXl: { fontSize: '18px', fontWeight: 400, lineHeight: 1.7 },
        bodyLg: { fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
        bodyMd: { fontSize: '14px', fontWeight: 400, lineHeight: 1.6 },
        bodySm: { fontSize: '12px', fontWeight: 400, lineHeight: 1.5 },
        bodyXs: { fontSize: '10px', fontWeight: 400, lineHeight: 1.5 },
    },

    // ── Shape ──────────────────────────────────────────────────────────────────
    shape: {
        borderRadius: 10,
    },

    // ── Component Overrides ────────────────────────────────────────────────────
    components: {
        MuiTypography: {
            defaultProps: {
                // Mapping custom variant ke HTML element yang tepat
                variantMapping: {
                    titleLg: 'h2',
                    titleMd: 'h3',
                    titleSm: 'h4',
                    bodyXl: 'p',
                    bodyLg: 'p',
                    bodyMd: 'p',
                    bodySm: 'p',
                    bodyXs: 'p',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    borderRadius: 12,
                    border: `1px solid ${borderColor['light']}`,
                },
            },
        },
        MuiTextField: {
            defaultProps: { size: 'small' },
        },
        MuiTableCell: {
            styleOverrides: {
                head: { fontWeight: 600, backgroundColor: baseColor['background-light'] },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: { borderColor: borderColor['default'] },
            },
        },
    },
});

export default theme;
