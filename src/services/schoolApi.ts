/**
 * School API Client - https://sekolah.devapi.id/
 * Provides real-time school data across Indonesia from Dapodik / Kemendikbudristek
 */

export interface SchoolAddress {
  jalan?: string;
  rt?: number;
  rw?: number;
  nama_dusun?: string;
  nama_desa?: string;
  nama_kecamatan?: string;
  nama_kabupaten?: string;
  nama_provinsi?: string;
  kode_wilayah?: string;
}

export interface SchoolItem {
  npsn: string;
  nama: string;
  bentukPendidikan?: string;
  jalurPendidikan?: string;
  jenjangPendidikan?: string;
  statusSatuanPendidikan?: 'NEGERI' | 'SWASTA' | string;
  akreditasi?: string;
  alamat?: SchoolAddress;
}

interface SchoolApiResponse {
  success: boolean;
  message: string;
  data: SchoolItem[];
  limit?: number;
  page?: number;
}

const BASE_URL = 'https://sekolah.devapi.id/sekolah';
const cache = new Map<string, SchoolItem[]>();

/**
 * Search schools by name or substring (minimum 2-3 characters)
 */
export const searchSchools = async (query: string, limit = 25): Promise<SchoolItem[]> => {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `${trimmed.toLowerCase()}_${limit}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const url = `${BASE_URL}?nama=${encodeURIComponent(trimmed)}&limit=${limit}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data: SchoolApiResponse = await res.json();
    if (data.success && Array.isArray(data.data)) {
      cache.set(cacheKey, data.data);
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching schools from sekolah.devapi.id:', error);
    return [];
  }
};

/**
 * Search school by specific NPSN
 */
export const getSchoolByNpsn = async (npsn: string): Promise<SchoolItem | null> => {
  const trimmed = npsn.trim();
  if (!trimmed) return null;

  try {
    const url = `${BASE_URL}?npsn=${encodeURIComponent(trimmed)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: SchoolApiResponse = await res.json();
    if (data.success && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching school by NPSN:', error);
    return null;
  }
};
