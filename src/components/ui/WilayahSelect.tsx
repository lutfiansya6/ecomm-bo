'use client';
// ============================================================
// WilayahSelect (Backoffice) - Cascading dropdown wilayah Indonesia
// Provinsi -> Kabupaten/Kota -> Kecamatan -> Kelurahan + Kode Pos
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface WilayahItem { id: string; name: string; }
interface VillageItem extends WilayahItem { postal_code: string; }

export interface WilayahValue {
  province: string; regency: string; district: string;
  village: string; postalCode: string;
}

interface Props {
  onChange: (val: WilayahValue) => void;
  initialValue?: Partial<WilayahValue>;
  disabled?: boolean;
  errors?: Partial<Record<keyof WilayahValue, string>>;
  apiBase?: string;
}

const DEFAULT_API = '/api/wilayah';

// options is always guarded with Array.isArray to prevent runtime crash
function WilayahDropdown({
  id, label, value, options, placeholder, disabled, loading, error, onChange,
}: {
  id: string; label: string; value: string; options: WilayahItem[];
  placeholder: string; disabled: boolean; loading: boolean;
  error?: string; onChange: (id: string, name: string) => void;
}) {
  const safeOptions = Array.isArray(options) ? options : [];
  return (
    <div className="flex flex-col gap-1.5">
      <label className="input-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <select
          id={id}
          className={`select w-full${error ? ' border-red-500' : ''}`}
          value={value}
          disabled={disabled || loading}
          onChange={(e) => {
            const opt = safeOptions.find((o) => o.id === e.target.value);
            onChange(e.target.value, opt?.name ?? '');
          }}
          style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <option value="">{placeholder}</option>
          {safeOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {loading && (
          <span className="absolute right-9 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            <Loader2 size={13} className="animate-spin text-gold" />
          </span>
        )}
      </div>
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} />{error}
        </span>
      )}
    </div>
  );
}

export default function WilayahSelect({
  onChange, initialValue, disabled = false, errors = {}, apiBase = DEFAULT_API,
}: Props) {
  const [provinceId, setProvinceId] = useState('');
  const [regencyId, setRegencyId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [villageId, setVillageId] = useState('');
  const [provinceName, setProvinceName] = useState(initialValue?.province ?? '');
  const [regencyName, setRegencyName] = useState(initialValue?.regency ?? '');
  const [districtName, setDistrictName] = useState(initialValue?.district ?? '');
  const [villageName, setVillageName] = useState(initialValue?.village ?? '');
  const [postalCode, setPostalCode] = useState(initialValue?.postalCode ?? '');

  // Always initialised as empty arrays — never undefined
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<VillageItem[]>([]);

  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingVil, setLoadingVil] = useState(false);
  const [apiError, setApiError] = useState('');

  // Fetch helper — always returns array, never throws
  async function apiFetch<T extends WilayahItem[]>(url: string): Promise<T> {
    setApiError('');
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setApiError(`Layanan data wilayah error (HTTP ${res.status})`);
        return [] as unknown as T;
      }
      let json: unknown;
      try { json = await res.json(); } catch {
        setApiError('Response dari server tidak valid');
        return [] as unknown as T;
      }
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        const w = json as { success?: boolean; data?: unknown; error?: string };
        if (!w.success) {
          setApiError(w.error ?? 'Terjadi kesalahan saat memuat data wilayah');
          return [] as unknown as T;
        }
        return (Array.isArray(w.data) ? w.data : []) as T;
      }
      return (Array.isArray(json) ? json : []) as T;
    } catch {
      setApiError('Layanan data wilayah sedang tidak tersedia');
      return [] as unknown as T;
    }
  }

  useEffect(() => {
    setLoadingProv(true);
    apiFetch<WilayahItem[]>(`${apiBase}/provinces`).then((data) => {
      setProvinces(data);
      setLoadingProv(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  const emit = useCallback((overrides: Partial<WilayahValue> = {}) => {
    onChange({ province: provinceName, regency: regencyName, district: districtName, village: villageName, postalCode, ...overrides });
  }, [onChange, provinceName, regencyName, districtName, villageName, postalCode]);

  const handleProvinceChange = async (id: string, name: string) => {
    setProvinceId(id); setProvinceName(name);
    setRegencyId(''); setRegencyName('');
    setDistrictId(''); setDistrictName('');
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setRegencies([]); setDistricts([]); setVillages([]);
    emit({ province: name, regency: '', district: '', village: '', postalCode: '' });
    if (!id) return;
    setLoadingReg(true);
    const data = await apiFetch<WilayahItem[]>(`${apiBase}/regencies/${id}`);
    setRegencies(data);
    setLoadingReg(false);
  };

  const handleRegencyChange = async (id: string, name: string) => {
    setRegencyId(id); setRegencyName(name);
    setDistrictId(''); setDistrictName('');
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setDistricts([]); setVillages([]);
    emit({ regency: name, district: '', village: '', postalCode: '' });
    if (!id) return;
    setLoadingDist(true);
    const data = await apiFetch<WilayahItem[]>(`${apiBase}/districts/${id}`);
    setDistricts(data);
    setLoadingDist(false);
  };

  const handleDistrictChange = async (id: string, name: string) => {
    setDistrictId(id); setDistrictName(name);
    setVillageId(''); setVillageName('');
    setPostalCode('');
    setVillages([]);
    emit({ district: name, village: '', postalCode: '' });
    if (!id) return;
    setLoadingVil(true);
    const data = await apiFetch<VillageItem[]>(`${apiBase}/villages/${id}`);
    setVillages(data);
    setLoadingVil(false);
  };

  const handleVillageChange = (id: string, name: string) => {
    setVillageId(id); setVillageName(name);
    const found = Array.isArray(villages) ? villages.find((v) => v.id === id) : undefined;
    const kodePos = found?.postal_code ?? '';
    setPostalCode(kodePos);
    emit({ village: name, postalCode: kodePos });
  };

  const anyLoading = loadingProv || loadingReg || loadingDist || loadingVil;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-[#262626]">
        <MapPin size={14} className="text-gold flex-shrink-0" />
        <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
          Wilayah
        </span>
        {anyLoading && <Loader2 size={12} className="animate-spin text-gold ml-auto" />}
      </div>

      {/* API error */}
      {apiError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
          <AlertCircle size={13} />{apiError}
        </div>
      )}

      {/* 2-col grid */}
      <div className="grid grid-cols-2 gap-4">
        <WilayahDropdown id="bo-wilayah-province" label="Provinsi" value={provinceId} options={provinces}
          placeholder={loadingProv ? 'Memuat...' : '— Pilih Provinsi —'}
          disabled={disabled || loadingProv} loading={loadingProv} error={errors.province}
          onChange={handleProvinceChange} />
        <WilayahDropdown id="bo-wilayah-regency" label="Kabupaten / Kota" value={regencyId} options={regencies}
          placeholder={!provinceId ? '— Pilih provinsi dulu —' : loadingReg ? 'Memuat...' : '— Pilih Kab/Kota —'}
          disabled={disabled || !provinceId || loadingReg} loading={loadingReg} error={errors.regency}
          onChange={handleRegencyChange} />
        <WilayahDropdown id="bo-wilayah-district" label="Kecamatan" value={districtId} options={districts}
          placeholder={!regencyId ? '— Pilih kab/kota dulu —' : loadingDist ? 'Memuat...' : '— Pilih Kecamatan —'}
          disabled={disabled || !regencyId || loadingDist} loading={loadingDist} error={errors.district}
          onChange={handleDistrictChange} />
        <WilayahDropdown id="bo-wilayah-village" label="Kelurahan / Desa" value={villageId} options={villages}
          placeholder={!districtId ? '— Pilih kecamatan dulu —' : loadingVil ? 'Memuat...' : '— Pilih Kelurahan —'}
          disabled={disabled || !districtId || loadingVil} loading={loadingVil} error={errors.village}
          onChange={handleVillageChange} />
      </div>

      {/* Kode Pos auto-filled */}
      {villageId && (
        <div className="flex flex-col gap-1.5 animate-fadeIn">
          <label className="input-label" htmlFor="bo-wilayah-postal">
            Kode Pos <span className="text-gold ml-1 text-[10px]">● OTOMATIS</span>
          </label>
          <input id="bo-wilayah-postal" className="input w-32" value={postalCode} readOnly
            style={{ color: 'var(--clr-gold)', fontWeight: 700, cursor: 'default', letterSpacing: '0.15em' }} />
        </div>
      )}

      {/* Summary chip */}
      {villageName && (
        <div className="p-3 rounded-xl bg-gold/10 border border-gold/25 text-xs text-gold/80 animate-fadeIn leading-relaxed">
          <span className="font-semibold">📍 </span>
          {[villageName, districtName, regencyName, provinceName].filter(Boolean).join(', ')}
          {postalCode && <span className="ml-2 opacity-75">{postalCode}</span>}
        </div>
      )}
    </div>
  );
}

export type { WilayahValue as WilayahData };
