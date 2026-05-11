import { Stack, TextField } from '@mui/material';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <Stack direction="row" sx={{ gap: 1 }}>
      <TextField
        type="date"
        size="small"
        label="Dari"
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: value.end } }}
        value={value.start}
        onChange={(e) => onChange({ ...value, start: e.target.value })}
      />
      <TextField
        type="date"
        size="small"
        label="Sampai"
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: value.start } }}
        value={value.end}
        onChange={(e) => onChange({ ...value, end: e.target.value })}
      />
    </Stack>
  );
}
