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

interface TenantSelectorProps {
    height?: string;
    isSubmitted?: boolean;
    displayNull?: boolean;
    errorMsg?: string;
    /**
     * Mode controlled — jika diberikan, komponen TIDAK membaca/menulis Zustand.
     * Gunakan ini di dalam form/dialog agar tidak men-trigger refetch halaman lain.
     * `value` adalah tenantId yang dipilih (null = belum dipilih).
     */
    value?: number | null;
    onChange?: (tenantId: number | null) => void;
}

/**
 * Tenant selector — hanya tampil jika user berstatus superadmin (isSuperadmin: true).
 *
 * ## Mode Uncontrolled (default)
 * Membaca & menulis `activeTenantId` di Zustand (scopeStore).
 * Cocok untuk filter tabel di halaman utama.
 *
 * ## Mode Controlled (`value` + `onChange`)
 * Tidak menyentuh Zustand sama sekali — state dikelola sepenuhnya oleh parent.
 * Cocok untuk dipakai di dalam dialog/form agar tidak memicu refetch halaman lain.
 *
 * @param height      - Tinggi input field (default "36px").
 * @param displayNull - false (default): sentinel "Semua Tenant" selalu ada, tidak bisa dikosongkan.
 *                      true: tanpa sentinel; placeholder "Pilih Tenant"; value boleh null.
 * @param value       - (Controlled) tenantId yang dipilih saat ini.
 * @param onChange    - (Controlled) callback saat user memilih tenant.
 */
export function TenantSelector({
    height = "36px",
    isSubmitted = false,
    displayNull = false,
    errorMsg = "Tenant wajib dipilih",
    value: controlledValue,
    onChange: controlledOnChange,
}: TenantSelectorProps) {
    const user = useAuthStore((s) => s.user);

    // Hanya baca Zustand jika mode uncontrolled
    const isControlled = controlledValue !== undefined;
    const { activeTenantId, setScope, clearScope } = useScopeStore();

    const activeTenantIdResolved = isControlled ? controlledValue : activeTenantId;

    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState(displayNull ? '' : 'Semua Tenant');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['tenants-selector', searchTerm],
        queryFn: () => tenantsApi.get({ keyword: searchTerm }),
        staleTime: 30_000,
        enabled: !!user?.isSuperadmin,
    });

    if (!user?.isSuperadmin) return null;

    const options: Tenant[] = displayNull
        ? (data?.result ?? [])
        : [ALL_TENANT, ...(data?.result ?? [])];

    const selectedTenant: Tenant | null = displayNull
        ? (activeTenantIdResolved === null
            ? null
            : (options.find((t) => t.id === activeTenantIdResolved) ?? null))
        : (activeTenantIdResolved === null
            ? ALL_TENANT
            : (options.find((t) => t.id === activeTenantIdResolved) ?? ALL_TENANT));

    function handleChange(_: React.SyntheticEvent, tenant: Tenant | null) {
        const isNullish = tenant === null || tenant.id === 0;

        if (isControlled) {
            // Mode controlled — hanya panggil callback parent, Zustand tidak disentuh
            controlledOnChange?.(isNullish ? null : tenant.id);
        } else {
            // Mode uncontrolled — tulis ke Zustand seperti sebelumnya
            if (isNullish) {
                clearScope();
            } else {
                setScope(tenant.id);
            }
        }
    }

    function handleInputChange(
        _: React.SyntheticEvent,
        val: string,
        reason: string,
    ) {
        setInputValue(val);

        if (reason === 'input') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setSearchTerm(val), 400);
        } else {
            // 'reset' (pilih option) atau 'clear' — batalkan debounce pending
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
            onChange={handleChange}
            onInputChange={handleInputChange}
            noOptionsText="Tenant tidak ditemukan"
            loadingText="Memuat..."
            sx={{ width: "100%" }}
            renderInput={(params) => (
                <TextField
                    {...params}
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