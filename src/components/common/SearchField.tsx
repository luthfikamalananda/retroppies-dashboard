import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { colors } from '../../theme/colors';
import { FILTER_CONTROL_HEIGHT } from './FilterToolbar';

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    sx?: SxProps<Theme>;
}

/**
 * Input pencarian standar untuk toolbar filter.
 * Tinggi & ikon konsisten dengan kontrol filter lain (lihat FilterToolbar).
 * Placeholder default "Search…" — override lewat prop bila perlu.
 */
export function SearchField({ value, onChange, placeholder = 'Search…', sx }: SearchFieldProps) {
    return (
        <TextField
            size="small"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
                bgcolor: colors.base['white'],
                '& .MuiInputBase-root': { height: FILTER_CONTROL_HEIGHT, fontSize: 14 },
                width: { xs: '100%', sm: 260 },
                ...sx,
            }}
        />
    );
}
