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
 * Default: "Semua Tenant" (tenant_id 0). Tidak bisa dikosongkan (disableClearable).
 * Pilihan disimpan ke scopeStore.activeTenantId (null = semua tenant).
 */
export function TenantSelector() {
    const user = useAuthStore((s) => s.user);
    const { activeTenantId, setScope, clearScope } = useScopeStore();

    // searchTerm = query yang dikirim ke API (debounced)
    // inputValue = teks yang tampil di input field (controlled)
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('Semua Tenant');
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

    const options: Tenant[] = [ALL_TENANT, ...(data?.result ?? [])];
    const selectedTenant = activeTenantId === null
        ? ALL_TENANT
        : (options.find((t) => t.id === activeTenantId) ?? ALL_TENANT);

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
            // reason 'reset' (user memilih option) atau 'clear' —
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
                    placeholder="Pilih Tenant"
                    sx={{
                        bgcolor: colors.base['white'],
                        '& .MuiOutlinedInput-root': { fontSize: 13, height: "36px" },
                    }}
                />
            )}
        />
    );
}
