export type PPDBData = {
   uid: string;
   school: 'mosa' | 'fajar';
   email: string;
   
   // Informasi Siswa
   jalur: 'prestasi' | 'reguler' | 'undangan' | 'pjj';
   namaSiswa: string;
   nik: string;
   nisn: string;
   jenisKelamin: string;
   tempatLahir: string;
   tanggalLahir: string;
   anakKe: string;
   jumlahSaudara: string;
   alamat: string;
   provinsi?: string;
   kabupaten: string;
   kecamatan: string;
   desa?: string;
   asalSekolah: string;
   asalSekolahManual?: string;
   alasanPilihan?: string;

   // Akademik
   nilaiAgama2: string;
   nilaiAgama3: string;
   nilaiAgama4: string;
   nilaiBindo2: string;
   nilaiBindo3: string;
   nilaiBindo4: string;
   nilaiBing2: string;
   nilaiBing3: string;
   nilaiBing4: string;
   nilaiMtk2: string;
   nilaiMtk3: string;
   nilaiMtk4: string;
   nilaiIpa2: string;
   nilaiIpa3: string;
   nilaiIpa4: string;

   // Informasi Orang Tua
   namaAyah: string;
   pekerjaanAyah: string;
   instansiAyah: string;
   hpAyah: string;
   namaIbu: string;
   pekerjaanIbu: string;
   instansiIbu: string;
   hpIbu: string;

   // Files
   rekomendasi?: string;
   raport2?: string;
   raport3?: string;
   raport4?: string;
   photo?: string;
   sertifikat?: string;
   ijazah?: string;
   kartuKeluarga?: string;
   aktaKelahiran?: string;
   lampiranA?: string;
   lampiranB?: string;
   pjjSchool?: string;

   // Status dan Metadata
   status: 'pending' | 'submitted' | 'draft';
   adminStatus?: 'diterima' | 'ditolak';
   createdAt: string;
   lastUpdated?: string;
   submittedAt?: string;
   alasanPenolakan?: string;
   
   updatedBy?: {
     email: string;
     name?: string;
     school: 'mosa' | 'fajar' | 'master';
     timestamp: string;
   };
   registrationNumber?: string;
   reRegistered?: boolean;
   reRegisteredAt?: string;
   wasReset?: boolean;
   isReset?: boolean;
};

export type BadgeProps = {
  status: PPDBData['status'];
  adminStatus?: PPDBData['adminStatus'];
  className?: string;
};

export type School = 'mosa' | 'fajar';
export type SchoolFilter = School | 'all';

export type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export type RecentPendaftar = {
  namaSiswa: string;
  jalur: string;
  submittedAt: string | undefined;
};

export type DashboardStats = {
  totalPendaftar: number;
  pendaftarBaru: number;
  pendaftarDiterima: number;
  pendaftarDitolak: number;
  jalurPrestasi: number;
  jalurReguler: number;
  jalurUndangan: number;
  jalurPjj: number;
  recentPendaftar: RecentPendaftar[];
};

export type StudentWithAverage = PPDBData & {
  average: number;
};