/**
 * ============================================================
 *  COLOR TOKENS — Retroppies Design System
 * ============================================================
 *  Cara mengisi:
 *  - Ganti '#000000' dengan hex dari Figma, dari gelap (900) ke terang (50)
 *  - Hapus step yang tidak ada di Figma (misal hanya 5 step, hapus sisanya)
 *  - Setelah diisi, nilai langsung tersedia di theme.palette.xxx
 * ============================================================
 */

// ─── Type Helpers ─────────────────────────────────────────────────────────────

export type ColorScale = {
  900: string; // paling gelap
  800: string;
  700: string;
  600: string;
  500: string; // main / default
  400: string;
  300: string;
  200: string;
  100: string;
};

export type BaseColorScale = {
  "black": string; // paling gelap
  "grey": string;
  "section": string;
  "background-light": string;
  "white": string; // main / default
};

export type BorderColorScale = {
  "light": string; // paling gelap
  "default": string;
  "hover": string;
  "dark": string;
  "disabled": string; // main / default
};

// ─── 1. Brand Color / Primary Color ──────────────────────────────────────────
//  Warna utama brand Retroppies
export const brandColor: ColorScale = {
  900: '#240C0C', // TODO: isi dari Figma — Brand/900
  800: '#471919', // TODO: isi dari Figma — Brand/800
  700: '#6B2525', // TODO: isi dari Figma — Brand/700
  600: '#8E3232', // TODO: isi dari Figma — Brand/600
  500: '#B23E3E', // TODO: isi dari Figma — Brand/500 (main)
  400: '#C16565', // TODO: isi dari Figma — Brand/400
  300: '#D18B8B', // TODO: isi dari Figma — Brand/300
  200: '#E0B2B2', // TODO: isi dari Figma — Brand/200
  100: '#F0D8D8', // TODO: isi dari Figma — Brand/100
};

// ─── 2. Base Color ────────────────────────────────────────────────────────────
//  Warna netral untuk background, surface, teks
export const baseColor: BaseColorScale = {
  "black": '#303030', // TODO: isi dari Figma — Base/900
  "grey": '#CCCCCC', // TODO: isi dari Figma — Base/800
  "section": '#F0F3FF', // TODO: isi dari Figma — Base/700
  "background-light": '#F9FBFE', // TODO: isi dari Figma — Base/600
  "white": '#FFFFFF', // TODO: isi dari Figma — Base/500
};

// ─── 3. Border Color ─────────────────────────────────────────────────────────
//  Skala warna khusus untuk garis/border
export const borderColor: BorderColorScale = {
  "light": '#EFEFEF', // TODO: isi dari Figma — Border/Light
  "default": '#E6E6E6', // TODO: isi dari Figma — Border/Default
  "hover": '#E0E0E0', // TODO: isi dari Figma — Border/Hover
  "dark": '#DBDBDB', // TODO: isi dari Figma — Border/Dark
  "disabled": '#F4F4F4', // TODO: isi dari Figma — Border/Disabled
};

// ─── 4. Secondary Color ───────────────────────────────────────────────────────
export const secondaryColor: ColorScale = {
  900: '#9C8A6B', // TODO: isi dari Figma — Secondary/900
  800: '#BBAC93', // TODO: isi dari Figma — Secondary/800
  700: '#D9CFBC', // TODO: isi dari Figma — Secondary/700
  600: '#F8F1E5', // TODO: isi dari Figma — Secondary/600
  500: '#F9F4EA', // TODO: isi dari Figma — Secondary/500 (main)
  400: '#FBF7EF', // TODO: isi dari Figma — Secondary/400
  300: '#FCF9F5', // TODO: isi dari Figma — Secondary/300
  200: '#FDFBF7', // TODO: isi dari Figma — Secondary/200
  100: '#FEFCFA', // TODO: isi dari Figma — Secondary/100
};

// ─── 5. Accent Color ──────────────────────────────────────────────────────────
export const accentColor: ColorScale = {
  900: '#504533', // TODO: isi dari Figma — Accent/900
  800: '#78684C', // TODO: isi dari Figma — Accent/800
  700: '#A08A66', // TODO: isi dari Figma — Accent/700
  600: '#C8AD7F', // TODO: isi dari Figma — Accent/600
  500: '#D3BD99', // TODO: isi dari Figma — Accent/500 (main)
  400: '#DECEB2', // TODO: isi dari Figma — Accent/400
  300: '#DECEB2', // TODO: isi dari Figma — Accent/300
  200: '#E9DECC', // TODO: isi dari Figma — Accent/200
  100: '#EFE6D9', // TODO: isi dari Figma — Accent/100
};

// ─── 6. Wood Tone ─────────────────────────────────────────────────────────────
export const woodToneColor: ColorScale = {
  900: '#31251A', // TODO: isi dari Figma — WoodTone/900
  800: '#493728', // TODO: isi dari Figma — WoodTone/800
  700: '#493728', // TODO: isi dari Figma — WoodTone/700
  600: '#7A5C42', // TODO: isi dari Figma — WoodTone/600
  500: '#957D68', // TODO: isi dari Figma — WoodTone/500
  400: '#AF9D8E', // TODO: isi dari Figma — WoodTone/400
  300: '#CABEB3', // TODO: isi dari Figma — WoodTone/300
  200: '#D7CEC6', // TODO: isi dari Figma — WoodTone/200
  100: '#E4DED9', // TODO: isi dari Figma — WoodTone/100
};

// ─── 7. Highlight Color ───────────────────────────────────────────────────────
export const highlightColor: ColorScale = {
  900: '#494D41', // TODO: isi dari Figma — Highlight/900
  800: '#6E7362', // TODO: isi dari Figma — Highlight/800
  700: '#929A82', // TODO: isi dari Figma — Highlight/700
  600: '#B7C0A3', // TODO: isi dari Figma — Highlight/600
  500: '#C5CDB5', // TODO: isi dari Figma — Highlight/500
  400: '#D4D9C8', // TODO: isi dari Figma — Highlight/400
  300: '#E2E6DA', // TODO: isi dari Figma — Highlight/300
  200: '#E9ECE3', // TODO: isi dari Figma — Highlight/200
  100: '#F1F2ED', // TODO: isi dari Figma — Highlight/100
};

// ─── 8. Error Color ───────────────────────────────────────────────────────────
export const errorColor: ColorScale = {
  900: '#6C0509', // TODO: isi dari Figma — Error/900
  800: '#830D09', // TODO: isi dari Figma — Error/800
  700: '#A21E0E', // TODO: isi dari Figma — Error/700
  600: '#C23415', // TODO: isi dari Figma — Error/600
  500: '#E24E1D', // TODO: isi dari Figma — Error/500 (main)
  400: '#ED8352', // TODO: isi dari Figma — Error/400
  300: '#F6A775', // TODO: isi dari Figma — Error/300
  200: '#FCCCA4', // TODO: isi dari Figma — Error/200
  100: '#FDE8D1', // TODO: isi dari Figma — Error/100
};

// ─── Convenience export ───────────────────────────────────────────────────────
//  Import langsung di komponen: import { colors } from '@/theme/colors';
//  Pakai: sx={{ color: colors.brand[500] }}
export const colors = {
  brand:     brandColor,
  base:      baseColor,
  border:    borderColor,
  secondary: secondaryColor,
  accent:    accentColor,
  woodTone:  woodToneColor,
  highlight: highlightColor,
  error:     errorColor,
} as const;
