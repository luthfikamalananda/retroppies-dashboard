import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, TextField } from '@mui/material';
import { tenantsApi, type Tenant } from '../../api/tenants.api';
import { useAuthStore } from '../../stores/authStore';
import { useScopeStore } from '../../stores/scopeStore';
import { colors } from '../../theme/colors';

/** Sentinel option — mewakili "semua tenant" (activeTenantId: null) */
const ALL_TENANT: Tenant = {
    id: 0,
    name: 'Semua Tenant',
    tenant_code: 'ALL',
    address: '',
    CreatedAt: '',
    CreatedBy: '',
    UpdatedAt: '',
    UpdatedBy: '',
};

const getLabel = (t: Tenant) =>
    t.id === 0 ? 'Semua Tenant' : `${t.tenant_code} — ${t.name}`;

/**
 * Tenant selector — hanya tampil jika user berstatus superadmin (isSuperadmin: true).
 * Pilihan disimpan ke scopeStore.activeTenantId (null = semua tenant / belum dipilih).
 *
 * @param height      - Tinggi input field (default "36px").
 * @param displayNull - Mengontrol perilaku "tidak ada pilihan":
 *   - false (default): sentinel "Semua Tenant" selalu tersedia di daftar dan
 *                      menjadi nilai awal; komponen tidak bisa dikosongkan.
 *   - true:            sentinel dihilangkan; placeholder berubah menjadi
 *                      "Pilih Tenant"; value boleh null (belum dipilih) dan
 *                      komponen bisa dikosongkan (clearable).
 */
export function TenantSelector({
    height = "36px",
    isSubmitted = false,
    displayNull = false,
    errorMsg = "Tenant wajib dipilih",
}: {
    height?: string;
    isSubmitted?: boolean;
    displayNull?: boolean;
    errorMsg?: string;
}) {
    const user = useAuthStore((s) => s.user);
    const { activeTenantId, setScope, clearScope } = useScopeStore();

    // searchTerm = query yang dikirim ke API (debounced)
    // inputValue = teks yang tampil di input field (controlled)
    const [searchTerm, setSearchTerm] = useState('');
    // displayNull true  → awal kosong (belum pilih apa-apa)
    // displayNull false → awal "Semua Tenant" (sentinel ALL_TENANT)
    const [inputValue, setInputValue] = useState(displayNull ? '' : 'Semua Tenant');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // useQuery dipanggil tanpa kondisi agar tidak melanggar Rules of Hooks.
    // enabled: false saat bukan superadmin agar tidak melakukan fetch.
    const { data, isLoading } = useQuery({
        queryKey: ['tenants-selector', searchTerm],
        queryFn: () => tenantsApi.get({ keyword: searchTerm }),
        staleTime: 30_000,
        enabled: !!user?.isSuperadmin,
    });

    if (!user?.isSuperadmin) return null;

    // displayNull true  → tanpa sentinel; value null berarti "belum dipilih"
    // displayNull false → dengan sentinel ALL_TENANT; value null tidak mungkin terjadi di UI
    const options: Tenant[] = displayNull
        ? (data?.result ?? [])
        : [ALL_TENANT, ...(data?.result ?? [])];

    const selectedTenant: Tenant | null = displayNull
        ? (activeTenantId === null
            ? null
            : (options.find((t) => t.id === activeTenantId) ?? null))
        : (activeTenantId === null
            ? ALL_TENANT
            : (options.find((t) => t.id === activeTenantId) ?? ALL_TENANT));

    function handleInputChange(
        _: React.SyntheticEvent,
        val: string,
        reason: string,
    ) {
        setInputValue(val);

        if (reason === 'input') {
            // User mengetik — debounce 400ms sebelum kirim ke API
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setSearchTerm(val), 400);
        } else if (reason === 'clear') {
            // User klik tombol X — reset input ke kosong dan kosongkan scope
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setSearchTerm('');
        } else {
            // reason 'reset' (user memilih option) —
            // batalkan debounce yang pending dan reset query ke kosong
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setSearchTerm('');
        }
    }

    return (
        <Autocomplete<Tenant, false, false>
            size="small"
            options={options}
            value={selectedTenant}
            inputValue={inputValue}
            loading={isLoading}
            getOptionLabel={getLabel}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            // displayNull false → disableClearable (tidak bisa dikosongkan)
            // disableClearable={!displayNull}
            onChange={(_, tenant) => {
                if (tenant === null || tenant.id === 0) {
                    clearScope();
                } else {
                    setScope(tenant.id);
                }
            }}
            onInputChange={handleInputChange}
            noOptionsText="Tenant tidak ditemukan"
            loadingText="Memuat..."
            sx={{ width: "100%" }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    // displayNull true  → "Pilih Tenant" (belum ada pilihan)
                    // displayNull false → "Semua Tenant" (sudah ada default)
                    placeholder={displayNull ? "Pilih Tenant" : "Semua Tenant"}
                    error={isSubmitted && selectedTenant === null}
                    helperText={isSubmitted && selectedTenant === null ? errorMsg : undefined}
                    sx={{
                        bgcolor: colors.base['white'],
                        '& .MuiOutlinedInput-root': { fontSize: 13, height: height },
                    }}
                />
            )}
        />
    );
}