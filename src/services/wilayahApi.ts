/**
 * Wilayah Indonesia API Client - https://wilayah.id/
 * Provides dynamic cascading administrative regions (Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa)
 * with multi-tier fallback and guaranteed alphabetical sorting (ASC A-Z).
 */

export interface WilayahItem {
  code: string;
  name: string;
}

// 1. Instant Cache: All 38 Provinces in Indonesia (Sorted A-Z)
export const INITIAL_PROVINCES: WilayahItem[] = [
  { code: '11', name: 'Aceh' },
  { code: '51', name: 'Bali' },
  { code: '36', name: 'Banten' },
  { code: '17', name: 'Bengkulu' },
  { code: '34', name: 'DI Yogyakarta' },
  { code: '31', name: 'DKI Jakarta' },
  { code: '75', name: 'Gorontalo' },
  { code: '15', name: 'Jambi' },
  { code: '32', name: 'Jawa Barat' },
  { code: '33', name: 'Jawa Tengah' },
  { code: '35', name: 'Jawa Timur' },
  { code: '61', name: 'Kalimantan Barat' },
  { code: '63', name: 'Kalimantan Selatan' },
  { code: '62', name: 'Kalimantan Tengah' },
  { code: '64', name: 'Kalimantan Timur' },
  { code: '65', name: 'Kalimantan Utara' },
  { code: '19', name: 'Kepulauan Bangka Belitung' },
  { code: '21', name: 'Kepulauan Riau' },
  { code: '18', name: 'Lampung' },
  { code: '81', name: 'Maluku' },
  { code: '82', name: 'Maluku Utara' },
  { code: '52', name: 'Nusa Tenggara Barat' },
  { code: '53', name: 'Nusa Tenggara Timur' },
  { code: '91', name: 'Papua' },
  { code: '92', name: 'Papua Barat' },
  { code: '96', name: 'Papua Barat Daya' },
  { code: '95', name: 'Papua Pegunungan' },
  { code: '93', name: 'Papua Selatan' },
  { code: '94', name: 'Papua Tengah' },
  { code: '14', name: 'Riau' },
  { code: '76', name: 'Sulawesi Barat' },
  { code: '73', name: 'Sulawesi Selatan' },
  { code: '72', name: 'Sulawesi Tengah' },
  { code: '74', name: 'Sulawesi Tenggara' },
  { code: '71', name: 'Sulawesi Utara' },
  { code: '13', name: 'Sumatera Barat' },
  { code: '16', name: 'Sumatera Selatan' },
  { code: '12', name: 'Sumatera Utara' }
].sort((a, b) => a.name.localeCompare(b.name, 'id'));

// 2. Instant Cache: All 23 Regencies in Aceh (Sorted A-Z)
export const INITIAL_ACEH_REGENCIES: WilayahItem[] = [
  { code: '11.05', name: 'Kabupaten Aceh Barat' },
  { code: '11.12', name: 'Kabupaten Aceh Barat Daya' },
  { code: '11.06', name: 'Kabupaten Aceh Besar' },
  { code: '11.14', name: 'Kabupaten Aceh Jaya' },
  { code: '11.01', name: 'Kabupaten Aceh Selatan' },
  { code: '11.10', name: 'Kabupaten Aceh Singkil' },
  { code: '11.16', name: 'Kabupaten Aceh Tamiang' },
  { code: '11.04', name: 'Kabupaten Aceh Tengah' },
  { code: '11.02', name: 'Kabupaten Aceh Tenggara' },
  { code: '11.03', name: 'Kabupaten Aceh Timur' },
  { code: '11.08', name: 'Kabupaten Aceh Utara' },
  { code: '11.17', name: 'Kabupaten Bener Meriah' },
  { code: '11.11', name: 'Kabupaten Bireuen' },
  { code: '11.13', name: 'Kabupaten Gayo Lues' },
  { code: '11.15', name: 'Kabupaten Nagan Raya' },
  { code: '11.07', name: 'Kabupaten Pidie' },
  { code: '11.18', name: 'Kabupaten Pidie Jaya' },
  { code: '11.09', name: 'Kabupaten Simeulue' },
  { code: '11.71', name: 'Kota Banda Aceh' },
  { code: '11.74', name: 'Kota Langsa' },
  { code: '11.73', name: 'Kota Lhokseumawe' },
  { code: '11.72', name: 'Kota Sabang' },
  { code: '11.75', name: 'Kota Subulussalam' }
].sort((a, b) => a.name.localeCompare(b.name, 'id'));

export const INITIAL_ACEH_DISTRICTS: Record<string, WilayahItem[]> = {
  // Aceh Besar (11.06) - Sorted A-Z
  '11.06': [
    { code: '11.06.20', name: 'Baitussalam' },
    { code: '11.06.23', name: 'Blang Bintang' },
    { code: '11.06.07', name: 'Darul Imarah' },
    { code: '11.06.19', name: 'Darul Kamal' },
    { code: '11.06.12', name: 'Darussalam' },
    { code: '11.06.03', name: 'Indrapuri' },
    { code: '11.06.10', name: 'Ingin Jaya' },
    { code: '11.06.15', name: 'Kota Jantho' },
    { code: '11.06.21', name: 'Krueng Barona Jaya' },
    { code: '11.06.11', name: 'Kuta Baro' },
    { code: '11.06.16', name: 'Kuta Cot Glie' },
    { code: '11.06.17', name: 'Kuta Malaka' },
    { code: '11.06.14', name: 'Lembah Seulawah' },
    { code: '11.06.22', name: 'Leupung' },
    { code: '11.06.02', name: 'Lhoknga' },
    { code: '11.06.01', name: 'Lhoong' },
    { code: '11.06.09', name: 'Mesjid Raya' },
    { code: '11.06.05', name: 'Montasik' },
    { code: '11.06.08', name: 'Peukan Bada' },
    { code: '11.06.13', name: 'Pulo Aceh' },
    { code: '11.06.04', name: 'Seulimeum' },
    { code: '11.06.18', name: 'Simpang Tiga' },
    { code: '11.06.06', name: 'Sukamakmur' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kota Banda Aceh (11.71) - Sorted A-Z
  '11.71': [
    { code: '11.71.01', name: 'Baiturrahman' },
    { code: '11.71.07', name: 'Banda Raya' },
    { code: '11.71.08', name: 'Jaya Baru' },
    { code: '11.71.02', name: 'Kuta Alam' },
    { code: '11.71.06', name: 'Kuta Raja' },
    { code: '11.71.05', name: 'Lueng Bata' },
    { code: '11.71.03', name: 'Meuraxa' },
    { code: '11.71.04', name: 'Syiah Kuala' },
    { code: '11.71.09', name: 'Ulee Kareng' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kota Sabang (11.72) - Sorted A-Z
  '11.72': [
    { code: '11.72.02', name: 'Sukajaya' },
    { code: '11.72.01', name: 'Sukakarya' },
    { code: '11.72.03', name: 'Sukamakmue' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kota Lhokseumawe (11.73) - Sorted A-Z
  '11.73': [
    { code: '11.73.02', name: 'Banda Sakti' },
    { code: '11.73.03', name: 'Blang Mangat' },
    { code: '11.73.01', name: 'Muara Dua' },
    { code: '11.73.04', name: 'Muara Satu' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kota Langsa (11.74) - Sorted A-Z
  '11.74': [
    { code: '11.74.05', name: 'Langsa Baro' },
    { code: '11.74.02', name: 'Langsa Barat' },
    { code: '11.74.03', name: 'Langsa Kota' },
    { code: '11.74.04', name: 'Langsa Lama' },
    { code: '11.74.01', name: 'Langsa Timur' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kota Subulussalam (11.75) - Sorted A-Z
  '11.75': [
    { code: '11.75.05', name: 'Longkib' },
    { code: '11.75.02', name: 'Penanggalan' },
    { code: '11.75.03', name: 'Rundeng' },
    { code: '11.75.01', name: 'Simpang Kiri' },
    { code: '11.75.04', name: 'Sultan Daulat' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kabupaten Pidie (11.07) - Sorted A-Z
  '11.07': [
    { code: '11.07.03', name: 'Batee' },
    { code: '11.07.04', name: 'Delima' },
    { code: '11.07.06', name: 'Geulumpang Tiga' },
    { code: '11.07.05', name: 'Geumpang' },
    { code: '11.07.29', name: 'Glumpang Baro' },
    { code: '11.07.25', name: 'Grong-grong' },
    { code: '11.07.07', name: 'Indra Jaya' },
    { code: '11.07.08', name: 'Kembang Tanjong' },
    { code: '11.07.22', name: 'Keumala' },
    { code: '11.07.09', name: 'Kota Sigli' },
    { code: '11.07.27', name: 'Mane' },
    { code: '11.07.11', name: 'Mila' },
    { code: '11.07.12', name: 'Muara Tiga' },
    { code: '11.07.13', name: 'Mutiara' },
    { code: '11.07.24', name: 'Mutiara Timur' },
    { code: '11.07.14', name: 'Padang Tiji' },
    { code: '11.07.15', name: 'Peukan Baro' },
    { code: '11.07.16', name: 'Pidie' },
    { code: '11.07.17', name: 'Sakti' },
    { code: '11.07.18', name: 'Simpang Tiga' },
    { code: '11.07.19', name: 'Tangse' },
    { code: '11.07.31', name: 'Titeue' },
    { code: '11.07.21', name: 'Tiro/Truseb' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id')),

  // Kabupaten Bireuen (11.11) - Sorted A-Z
  '11.11': [
    { code: '11.11.07', name: 'Gandapura' },
    { code: '11.11.10', name: 'Jangka' },
    { code: '11.11.02', name: 'Jeunieb' },
    { code: '11.11.04', name: 'Jeumpa' },
    { code: '11.11.09', name: 'Juli' },
    { code: '11.11.13', name: 'Kota Juang' },
    { code: '11.11.14', name: 'Kuala' },
    { code: '11.11.17', name: 'Kuta Blang' },
    { code: '11.11.06', name: 'Makmur' },
    { code: '11.11.08', name: 'Pandrah' },
    { code: '11.11.03', name: 'Peudada' },
    { code: '11.11.12', name: 'Peulimbang' },
    { code: '11.11.05', name: 'Peusangan' },
    { code: '11.11.16', name: 'Peusangan Selatan' },
    { code: '11.11.15', name: 'Peusangan Siblah Krueng' },
    { code: '11.11.01', name: 'Samalanga' },
    { code: '11.11.11', name: 'Simpang Mamplam' }
  ].sort((a, b) => a.name.localeCompare(b.name, 'id'))
};

// In-memory cache
const provinceCache: WilayahItem[] = [...INITIAL_PROVINCES];
const regencyCache = new Map<string, WilayahItem[]>([
  ['11', INITIAL_ACEH_REGENCIES]
]);
const districtCache = new Map<string, WilayahItem[]>(
  Object.entries(INITIAL_ACEH_DISTRICTS)
);
const villageCache = new Map<string, WilayahItem[]>();

// Helper fetch with timeout
const fetchJsonWithTimeout = async (url: string, timeoutMs = 5000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

/**
 * Fetch all provinces in Indonesia (Sorted A-Z)
 */
export const getProvinces = async (): Promise<WilayahItem[]> => {
  if (provinceCache.length > 0) return provinceCache;

  const urls = [
    '/api-wilayah/provinces.json',
    'https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json'
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonWithTimeout(url);
      const rawList = Array.isArray(data) ? data : (data.data || []);
      if (rawList.length > 0) {
        const parsed: WilayahItem[] = rawList.map((x: any) => ({
          code: String(x.code || x.id || ''),
          name: String(x.name || '')
        })).sort((a: WilayahItem, b: WilayahItem) => a.name.localeCompare(b.name, 'id'));
        provinceCache.length = 0;
        provinceCache.push(...parsed);
        return parsed;
      }
    } catch {
      // Continue to next fallback
    }
  }

  return INITIAL_PROVINCES;
};

/**
 * Fetch regencies (Kabupaten / Kota) by province code (Sorted A-Z)
 */
export const getRegencies = async (provinceCode: string): Promise<WilayahItem[]> => {
  if (!provinceCode) return [];
  if (regencyCache.has(provinceCode)) {
    return regencyCache.get(provinceCode)!;
  }

  if (provinceCode === '11') {
    return INITIAL_ACEH_REGENCIES;
  }

  const urls = [
    `/api-wilayah/regencies/${provinceCode}.json`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceCode}.json`
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonWithTimeout(url);
      const rawList = Array.isArray(data) ? data : (data.data || []);
      if (rawList.length > 0) {
        const parsed: WilayahItem[] = rawList.map((x: any) => ({
          code: String(x.code || x.id || ''),
          name: String(x.name || '')
        })).sort((a: WilayahItem, b: WilayahItem) => a.name.localeCompare(b.name, 'id'));
        regencyCache.set(provinceCode, parsed);
        return parsed;
      }
    } catch {
      // Continue to next fallback
    }
  }

  return provinceCode === '11' ? INITIAL_ACEH_REGENCIES : [];
};

/**
 * Fetch districts (Kecamatan) by regency code (Sorted A-Z)
 */
export const getDistricts = async (regencyCode: string): Promise<WilayahItem[]> => {
  if (!regencyCode) return [];
  if (districtCache.has(regencyCode)) {
    return districtCache.get(regencyCode)!;
  }

  const dotCode = regencyCode.includes('.') ? regencyCode : `${regencyCode.slice(0, 2)}.${regencyCode.slice(2)}`;
  const flatCode = regencyCode.replace('.', '');

  const urls = [
    `/api-wilayah/districts/${dotCode}.json`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${flatCode}.json`
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonWithTimeout(url);
      const rawList = Array.isArray(data) ? data : (data.data || []);
      if (rawList.length > 0) {
        const parsed: WilayahItem[] = rawList.map((x: any) => ({
          code: String(x.code || x.id || ''),
          name: String(x.name || '')
        })).sort((a: WilayahItem, b: WilayahItem) => a.name.localeCompare(b.name, 'id'));
        districtCache.set(regencyCode, parsed);
        return parsed;
      }
    } catch {
      // Continue to next fallback
    }
  }

  return [];
};

/**
 * Fetch villages (Desa / Kelurahan) by district code (Sorted A-Z)
 */
export const getVillages = async (districtCode: string): Promise<WilayahItem[]> => {
  if (!districtCode) return [];
  if (villageCache.has(districtCode)) {
    return villageCache.get(districtCode)!;
  }

  const dotCode = districtCode;
  const flatCode = districtCode.replace(/\./g, '');

  const urls = [
    `/api-wilayah/villages/${dotCode}.json`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${flatCode}.json`
  ];

  for (const url of urls) {
    try {
      const data = await fetchJsonWithTimeout(url);
      const rawList = Array.isArray(data) ? data : (data.data || []);
      if (rawList.length > 0) {
        const parsed: WilayahItem[] = rawList.map((x: any) => ({
          code: String(x.code || x.id || ''),
          name: String(x.name || '')
        })).sort((a: WilayahItem, b: WilayahItem) => a.name.localeCompare(b.name, 'id'));
        villageCache.set(districtCode, parsed);
        return parsed;
      }
    } catch {
      // Continue to next fallback
    }
  }

  return [];
};

/**
 * Find Province Code by Name (case-insensitive & fuzzy)
 */
export const findProvinceCode = (provinceName: string, provinceList: WilayahItem[] = INITIAL_PROVINCES): string => {
  if (!provinceName) return '11';
  const clean = provinceName.trim().toUpperCase();
  const match = provinceList.find(p => p.name.toUpperCase() === clean || p.name.toUpperCase().includes(clean));
  return match ? match.code : '11';
};

/**
 * Find Regency Code by Name (case-insensitive & fuzzy)
 */
export const findRegencyCode = (regencyName: string, regencyList: WilayahItem[]): string => {
  if (!regencyName) return '';
  const clean = regencyName.trim().toUpperCase();
  
  const exact = regencyList.find(r => r.name.toUpperCase() === clean);
  if (exact) return exact.code;

  const rawClean = clean.replace('KABUPATEN ', '').replace('KOTA ', '').trim();

  const fuzzy = regencyList.find(r => {
    const rName = r.name.toUpperCase();
    const rRaw = rName.replace('KABUPATEN ', '').replace('KOTA ', '').trim();
    return rName === clean || rRaw === rawClean || rName.includes(rawClean) || clean.includes(rRaw);
  });
  return fuzzy ? fuzzy.code : '';
};

/**
 * Standard Aceh Kabupaten/Kota Kode Mapping (01 - 23, and 24 for Luar Daerah)
 */
export const getKabupatenRegistrationCode = (kabupatenName: string, provinceName?: string): string => {
  if (!kabupatenName) return '00';
  const cleanKab = kabupatenName.toUpperCase().trim();
  const cleanProv = (provinceName || '').toUpperCase().trim();

  if (cleanProv && cleanProv !== 'ACEH' && !cleanProv.includes('ACEH')) {
    return '24';
  }

  if (cleanKab.includes('BANDA ACEH')) return '01';
  if (cleanKab.includes('SABANG')) return '02';
  if (cleanKab.includes('LHOKSEUMAWE')) return '03';
  if (cleanKab.includes('LANGSA')) return '04';
  if (cleanKab.includes('SUBULUSSALAM')) return '05';
  if (cleanKab.includes('ACEH BESAR')) return '06';
  if (cleanKab.includes('PIDIE JAYA')) return '08';
  if (cleanKab.includes('PIDIE')) return '07';
  if (cleanKab.includes('BIREUEN')) return '09';
  if (cleanKab.includes('ACEH TENGAH')) return '10';
  if (cleanKab.includes('BENER MERIAH')) return '11';
  if (cleanKab.includes('ACEH UTARA')) return '12';
  if (cleanKab.includes('ACEH TIMUR')) return '13';
  if (cleanKab.includes('ACEH TAMIANG')) return '14';
  if (cleanKab.includes('ACEH SINGKIL')) return '15';
  if (cleanKab.includes('ACEH JAYA')) return '16';
  if (cleanKab.includes('ACEH BARAT DAYA')) return '20';
  if (cleanKab.includes('ACEH BARAT')) return '17';
  if (cleanKab.includes('NAGAN RAYA')) return '18';
  if (cleanKab.includes('SIMEULUE')) return '19';
  if (cleanKab.includes('ACEH SELATAN')) return '21';
  if (cleanKab.includes('ACEH TENGGARA')) return '22';
  if (cleanKab.includes('GAYO LUES')) return '23';

  return '24';
};
