import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PPDBData } from '../../../types/ppdb';
import { getJalurLabel } from '../AdminBadges';
import { showAlert } from '../../ui/Alert';

export const getStatusKelengkapan = (data: PPDBData) => {
  let fieldsToCheck: (string | undefined)[] = [
    // Data pribadi wajib
    data.namaSiswa,
    data.nisn,
    data.nik,
    data.jenisKelamin,
    data.tempatLahir,
    data.tanggalLahir,
    data.alamat,
    // Data sekolah
    data.asalSekolah,
    data.jalur,
    data.alasanPilihan,
    // Data orang tua
    data.namaAyah,
    data.pekerjaanAyah,
    data.instansiAyah,
    data.hpAyah,
    data.namaIbu,
    data.pekerjaanIbu,
    data.instansiIbu,
    data.hpIbu,
  ];

  if (data.jalur === 'pjj') {
    fieldsToCheck = [
      ...fieldsToCheck,
      data.photo,
      data.ijazah,
      data.kartuKeluarga,
      data.aktaKelahiran
    ];
  } else {
    fieldsToCheck = [
      ...fieldsToCheck,
      // Nilai akademik
      data.nilaiAgama2,
      data.nilaiBindo2,
      data.nilaiBing2,
      data.nilaiMtk2,
      data.nilaiIpa2,
      data.nilaiAgama3,
      data.nilaiBindo3,
      data.nilaiBing3,
      data.nilaiMtk3,
      data.nilaiIpa3,
      data.nilaiAgama4,
      data.nilaiBindo4,
      data.nilaiBing4,
      data.nilaiMtk4,
      data.nilaiIpa4,
      // Dokumen wajib
      data.photo,
      data.rekomendasi,
      data.raport2,
      data.raport3,
      data.raport4
    ];

    if (data.jalur === 'prestasi' && data.sertifikat) {
      fieldsToCheck.push(data.sertifikat);
    }
  }

  const filledFields = fieldsToCheck.filter(field => field && field !== '').length;
  const totalFields = fieldsToCheck.length;
  const percentage = Math.round((filledFields / totalFields) * 100);

  if (percentage >= 90) return 'Lengkap';
  if (percentage >= 70) return 'Hampir Lengkap';
  if (percentage >= 50) return 'Setengah';
  if (percentage > 0) return 'Sebagian';
  return 'Kosong';
};

const setupWorksheet = (workbook: ExcelJS.Workbook, name: string, data: PPDBData[], mode: 'regular' | 'pjj') => {
  const worksheet = workbook.addWorksheet(name);

  // Header Styling (Slate Dark header with clean white text)
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' }, size: 10, name: 'Segoe UI' },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '1E293B' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { argb: '475569' } },
      left: { style: 'thin' as const, color: { argb: '475569' } },
      bottom: { style: 'medium' as const, color: { argb: '0F172A' } },
      right: { style: 'thin' as const, color: { argb: '475569' } }
    }
  };

  const isPJJ = mode === 'pjj';
  
  const baseColumns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'No. Pendaftaran', key: 'registrationNumber', width: 22 },
    { header: 'NISN', key: 'nisn', width: 16 },
    { header: 'Nama Lengkap', key: 'namaSiswa', width: 38 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Jalur', key: 'jalur', width: 16 },
    { header: 'Status Kelengkapan', key: 'statusKelengkapan', width: 20 },
    { header: 'Status', key: 'statusKeputusan', width: 16 },
    { header: 'Daftar Ulang', key: 'reRegistered', width: 15 },
    { header: 'Waktu Daftar Ulang', key: 'reRegisteredAt', width: 24 },
    { header: 'Pemeriksa', key: 'adminName', width: 25 },
    { header: 'Alasan Penolakan', key: 'alasanPenolakan', width: 45 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 16 },
    { header: 'Tempat Lahir', key: 'tempatLahir', width: 25 },
    { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 16 },
    { header: 'Anak Ke', key: 'anakKe', width: 10 },
    { header: 'Jumlah Saudara', key: 'jumlahSaudara', width: 16 },
    { header: 'Alamat', key: 'alamat', width: 45 },
    { header: 'Kecamatan', key: 'kecamatan', width: 22 },
    { header: 'Kabupaten', key: 'kabupaten', width: 22 },
    { header: 'Asal Sekolah', key: 'asalSekolah', width: 38 },
    { header: 'Alasan Memilih Sekolah', key: 'alasanPilihan', width: 45 },
    ...(isPJJ ? [{ header: 'Sekolah PJJ', key: 'pjjSchool', width: 38 }] : [])
  ];

  let dynamicColumns: any[] = [];
  if (!isPJJ) {
    dynamicColumns = [
      { header: 'Agama Sem 2', key: 'nilaiAgama2', width: 14 },
      { header: 'Agama Sem 3', key: 'nilaiAgama3', width: 14 },
      { header: 'Agama Sem 4', key: 'nilaiAgama4', width: 14 },
      { header: 'B.Indo Sem 2', key: 'nilaiBindo2', width: 14 },
      { header: 'B.Indo Sem 3', key: 'nilaiBindo3', width: 14 },
      { header: 'B.Indo Sem 4', key: 'nilaiBindo4', width: 14 },
      { header: 'B.Ing Sem 2', key: 'nilaiBing2', width: 14 },
      { header: 'B.Ing Sem 3', key: 'nilaiBing3', width: 14 },
      { header: 'B.Ing Sem 4', key: 'nilaiBing4', width: 14 },
      { header: 'MTK Sem 2', key: 'nilaiMtk2', width: 14 },
      { header: 'MTK Sem 3', key: 'nilaiMtk3', width: 14 },
      { header: 'MTK Sem 4', key: 'nilaiMtk4', width: 14 },
      { header: 'IPA Sem 2', key: 'nilaiIpa2', width: 14 },
      { header: 'IPA Sem 3', key: 'nilaiIpa3', width: 14 },
      { header: 'IPA Sem 4', key: 'nilaiIpa4', width: 14 },
    ];
  }

  const parentColumns = [
    { header: 'Nama Ayah', key: 'namaAyah', width: 38 },
    { header: 'Pekerjaan Ayah', key: 'pekerjaanAyah', width: 28 },
    { header: 'Instansi Ayah', key: 'instansiAyah', width: 35 },
    { header: 'No HP Ayah', key: 'hpAyah', width: 18 },
    { header: 'Nama Ibu', key: 'namaIbu', width: 38 },
    { header: 'Pekerjaan Ibu', key: 'pekerjaanIbu', width: 28 },
    { header: 'Instansi Ibu', key: 'instansiIbu', width: 35 },
    { header: 'No HP Ibu', key: 'hpIbu', width: 18 },
  ];

  let docColumns: any[] = [];
  let rawLinkColumns: any[] = [];
  if (isPJJ) {
    docColumns = [
      { header: 'Foto', key: 'photo', width: 16 },
      { header: 'FC Ijazah', key: 'ijazah', width: 16 },
      { header: 'Kartu Keluarga', key: 'kartuKeluarga', width: 16 },
      { header: 'Akta Kelahiran', key: 'aktaKelahiran', width: 16 },
      { header: 'Lampiran A', key: 'lampiranA', width: 16 },
      { header: 'Lampiran B', key: 'lampiranB', width: 16 },
    ];
    rawLinkColumns = [
      { header: 'Link Foto', key: 'photoLink', width: 50 },
      { header: 'Link FC Ijazah', key: 'ijazahLink', width: 50 },
      { header: 'Link Kartu Keluarga', key: 'kartuKeluargaLink', width: 50 },
      { header: 'Link Akta Kelahiran', key: 'aktaKelahiranLink', width: 50 },
      { header: 'Link Lampiran A', key: 'lampiranALink', width: 50 },
      { header: 'Link Lampiran B', key: 'lampiranBLink', width: 50 },
    ];
  } else {
    docColumns = [
      { header: 'Foto', key: 'photo', width: 16 },
      { header: 'Rekomendasi', key: 'rekomendasi', width: 16 },
      { header: 'Raport 2', key: 'raport2', width: 16 },
      { header: 'Raport 3', key: 'raport3', width: 16 },
      { header: 'Raport 4', key: 'raport4', width: 16 },
    ];
    rawLinkColumns = [
      { header: 'Link Foto', key: 'photoLink', width: 50 },
      { header: 'Link Rekomendasi', key: 'rekomendasiLink', width: 50 },
      { header: 'Link Raport 2', key: 'raport2Link', width: 50 },
      { header: 'Link Raport 3', key: 'raport3Link', width: 50 },
      { header: 'Link Raport 4', key: 'raport4Link', width: 50 },
    ];
  }

  const metadataColumns = [
    { header: 'Tanggal Daftar', key: 'createdAt', width: 22 },
    { header: 'Terakhir Diupdate', key: 'lastUpdated', width: 22 },
    { header: 'Diupdate Oleh', key: 'updatedByEmail', width: 30 },
    { header: 'Admin Sekolah', key: 'updatedBySchool', width: 25 },
    { header: 'Waktu Update', key: 'updatedByTime', width: 22 },
  ];

  const columns = [
    ...baseColumns,
    ...dynamicColumns,
    ...parentColumns,
    ...docColumns,
    ...metadataColumns,
    ...rawLinkColumns
  ];

  worksheet.columns = columns;

  // Header row height & style
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });

  // Freeze panes to include No. Pendaftaran and basic info
  worksheet.views = [{
    state: 'frozen',
    xSplit: 5,
    ySplit: 1,
    activeCell: 'A2'
  }];

  const rowData = data.map((item, index) => {
    const baseData = {
      no: index + 1,
      registrationNumber: item.registrationNumber || '-',
      nisn: item.nisn || '-',
      namaSiswa: item.namaSiswa || '-',
      email: item.email || '-',
      jalur: item.jalur ? getJalurLabel(item.jalur) : '-',
      statusKelengkapan: getStatusKelengkapan(item),
      statusKeputusan: item.status === 'draft' ? 'DRAFT' : (item.adminStatus ? 
        (item.adminStatus === 'diterima' ? 'DITERIMA' : 'DITOLAK') : 
        'PENDING'),
      reRegistered: item.adminStatus === 'diterima' ? (item.reRegistered ? 'Sudah' : 'Belum') : '-',
      reRegisteredAt: item.reRegisteredAt ? new Date(item.reRegisteredAt).toLocaleString('id-ID') : '-',
      adminName: item.updatedBy?.name || item.updatedBy?.email?.split('@')[0] || '-',
      alasanPenolakan: item.alasanPenolakan || '-',
      nik: item.nik || '-',
      jenisKelamin: item.jenisKelamin === 'L' ? 'Laki-laki' : (item.jenisKelamin === 'P' ? 'Perempuan' : '-'),
      tempatLahir: item.tempatLahir || '-',
      tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString('id-ID') : '-',
      anakKe: item.anakKe ?? '-',
      jumlahSaudara: item.jumlahSaudara ?? '-',
      alamat: item.alamat || '-',
      kecamatan: item.kecamatan || '-',
      kabupaten: item.kabupaten || '-',
      asalSekolah: item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : (item.asalSekolah || '-'),
      alasanPilihan: item.alasanPilihan || '-',
      pjjSchool: item.pjjSchool || '-'
    };

    let academicData = {};
    if (!isPJJ) {
      academicData = {
        nilaiAgama2: item.nilaiAgama2 ?? '-',
        nilaiAgama3: item.nilaiAgama3 ?? '-',
        nilaiAgama4: item.nilaiAgama4 ?? '-',
        nilaiBindo2: item.nilaiBindo2 ?? '-',
        nilaiBindo3: item.nilaiBindo3 ?? '-',
        nilaiBindo4: item.nilaiBindo4 ?? '-',
        nilaiBing2: item.nilaiBing2 ?? '-',
        nilaiBing3: item.nilaiBing3 ?? '-',
        nilaiBing4: item.nilaiBing4 ?? '-',
        nilaiMtk2: item.nilaiMtk2 ?? '-',
        nilaiMtk3: item.nilaiMtk3 ?? '-',
        nilaiMtk4: item.nilaiMtk4 ?? '-',
        nilaiIpa2: item.nilaiIpa2 ?? '-',
        nilaiIpa3: item.nilaiIpa3 ?? '-',
        nilaiIpa4: item.nilaiIpa4 ?? '-',
      };
    }

    const parentData = {
      namaAyah: item.namaAyah || '-',
      pekerjaanAyah: item.pekerjaanAyah || '-',
      instansiAyah: item.instansiAyah || '-',
      hpAyah: item.hpAyah || '-',
      namaIbu: item.namaIbu || '-',
      pekerjaanIbu: item.pekerjaanIbu || '-',
      instansiIbu: item.instansiIbu || '-',
      hpIbu: item.hpIbu || '-',
    };

    let documentData = {};
    if (isPJJ) {
      documentData = {
        photo: item.photo ? {
          text: 'Lihat Foto',
          hyperlink: item.photo,
          tooltip: 'Klik untuk melihat pas foto'
        } : '',
        ijazah: item.ijazah ? {
          text: 'Lihat Ijazah',
          hyperlink: item.ijazah,
          tooltip: 'Klik untuk melihat FC Ijazah'
        } : '',
        kartuKeluarga: item.kartuKeluarga ? {
          text: 'Lihat KK',
          hyperlink: item.kartuKeluarga,
          tooltip: 'Klik untuk melihat Kartu Keluarga'
        } : '',
        aktaKelahiran: item.aktaKelahiran ? {
          text: 'Lihat Akta',
          hyperlink: item.aktaKelahiran,
          tooltip: 'Klik untuk melihat Akta Kelahiran'
        } : '',
        lampiranA: item.lampiranA ? {
          text: 'Lihat Lampiran A',
          hyperlink: item.lampiranA,
          tooltip: 'Klik untuk melihat Lampiran A'
        } : '',
        lampiranB: item.lampiranB ? {
          text: 'Lihat Lampiran B',
          hyperlink: item.lampiranB,
          tooltip: 'Klik untuk melihat Lampiran B'
        } : '',
        photoLink: item.photo || '',
        ijazahLink: item.ijazah || '',
        kartuKeluargaLink: item.kartuKeluarga || '',
        aktaKelahiranLink: item.aktaKelahiran || '',
        lampiranALink: item.lampiranA || '',
        lampiranBLink: item.lampiranB || '',
      };
    } else {
      documentData = {
        photo: item.photo ? {
          text: 'Lihat Dokumen',
          hyperlink: item.photo,
          tooltip: 'Klik untuk melihat dokumen'
        } : '',
        rekomendasi: item.rekomendasi ? {
          text: 'Lihat Dokumen',
          hyperlink: item.rekomendasi,
          tooltip: 'Klik untuk melihat dokumen'
        } : '',
        raport2: item.raport2 ? {
          text: 'Lihat Dokumen',
          hyperlink: item.raport2,
          tooltip: 'Klik untuk melihat dokumen'
        } : '',
        raport3: item.raport3 ? {
          text: 'Lihat Dokumen',
          hyperlink: item.raport3,
          tooltip: 'Klik untuk melihat dokumen'
        } : '',
        raport4: item.raport4 ? {
          text: 'Lihat Dokumen',
          hyperlink: item.raport4,
          tooltip: 'Klik untuk melihat dokumen'
        } : '',
        photoLink: item.photo || '',
        rekomendasiLink: item.rekomendasi || '',
        raport2Link: item.raport2 || '',
        raport3Link: item.raport3 || '',
        raport4Link: item.raport4 || '',
      };
    }

    const metadataData = {
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-',
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-',
      updatedByEmail: item.updatedBy?.name || item.updatedBy?.email?.split('@')[0] || '-',
      updatedBySchool: item.updatedBy?.school === 'mosa' ? 'SMAN Modal Bangsa' : item.updatedBy?.school === 'fajar' ? 'SMAN 10 Fajar Harapan' : 'Admin Master',
      updatedByTime: item.updatedBy?.timestamp ? 
        new Date(item.updatedBy.timestamp).toLocaleString('id-ID') : '-',
    };

    return {
      ...baseData,
      ...academicData,
      ...parentData,
      ...documentData,
      ...metadataData
    };
  });

  worksheet.addRows(rowData);

  const centerKeys = new Set([
    'no',
    'registrationNumber',
    'nisn',
    'nik',
    'jalur',
    'statusKelengkapan',
    'statusKeputusan',
    'reRegistered',
    'reRegisteredAt',
    'jenisKelamin',
    'tanggalLahir',
    'anakKe',
    'jumlahSaudara',
    'nilaiAgama2', 'nilaiAgama3', 'nilaiAgama4',
    'nilaiBindo2', 'nilaiBindo3', 'nilaiBindo4',
    'nilaiBing2', 'nilaiBing3', 'nilaiBing4',
    'nilaiMtk2', 'nilaiMtk3', 'nilaiMtk4',
    'nilaiIpa2', 'nilaiIpa3', 'nilaiIpa4',
    'photo', 'rekomendasi', 'raport2', 'raport3', 'raport4',
    'ijazah', 'kartuKeluarga', 'aktaKelahiran', 'lampiranA', 'lampiranB',
    'createdAt', 'lastUpdated', 'updatedByTime'
  ]);

  const docKeys = ['photo', 'rekomendasi', 'raport2', 'raport3', 'raport4', 'ijazah', 'kartuKeluarga', 'aktaKelahiran', 'lampiranA', 'lampiranB'];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      row.height = 22; // Comfortable row height

      row.eachCell((cell, colNumber) => {
        const colDef = worksheet.columns[colNumber - 1];
        const colKey = colDef ? colDef.key : '';

        cell.border = {
          top: { style: 'thin' as const, color: { argb: 'E2E8F0' } },
          left: { style: 'thin' as const, color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin' as const, color: { argb: 'E2E8F0' } },
          right: { style: 'thin' as const, color: { argb: 'E2E8F0' } }
        };

        cell.alignment = { vertical: 'middle' as const };

        // Jalur Badge
        if (colKey === 'jalur') {
          const jalurValue = cell.value as string;
          if (jalurValue === 'Prestasi') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
            cell.font = { color: { argb: '1E40AF' }, bold: true };
          } else if (jalurValue === 'Reguler') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            cell.font = { color: { argb: '166534' }, bold: true };
          } else if (jalurValue === 'Undangan') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FF' } };
            cell.font = { color: { argb: '6B21A8' }, bold: true };
          } else if (jalurValue === 'PJJ') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            cell.font = { color: { argb: 'B45309' }, bold: true };
          }
        }

        // Status Kelengkapan Badge
        if (colKey === 'statusKelengkapan') {
          const val = cell.value as string;
          if (val === 'Lengkap') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            cell.font = { color: { argb: '166534' }, bold: true };
          } else if (val === 'Hampir Lengkap' || val === 'Setengah') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
            cell.font = { color: { argb: '1E40AF' }, bold: true };
          } else if (val === 'Sebagian') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            cell.font = { color: { argb: 'B45309' }, bold: true };
          } else if (val === 'Kosong') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
            cell.font = { color: { argb: '374151' }, bold: true };
          }
        }

        // Status Keputusan Badge
        if (colKey === 'statusKeputusan') {
          if (cell.value === 'DITERIMA') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            cell.font = { color: { argb: '166534' }, bold: true };
          } else if (cell.value === 'DITOLAK') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
            cell.font = { color: { argb: 'B91C1C' }, bold: true };
          } else if (cell.value === 'PENDING') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
            cell.font = { color: { argb: 'B45309' }, bold: true };
          } else if (cell.value === 'DRAFT') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };
            cell.font = { color: { argb: '3730A3' }, bold: true };
          }
        }

        // Daftar Ulang Badge
        if (colKey === 'reRegistered') {
          if (cell.value === 'Sudah') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
            cell.font = { color: { argb: '166534' }, bold: true };
          } else if (cell.value === 'Belum') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };
            cell.font = { color: { argb: '374151' }, bold: true };
          }
        }

        if (colKey && centerKeys.has(colKey)) {
          cell.alignment = {
            vertical: 'middle' as const,
            horizontal: 'center' as const
          };
        }

        if (colKey === 'alasanPenolakan' || colKey === 'alamat') {
          cell.alignment = {
            vertical: 'middle' as const,
            wrapText: true
          };
        }

        // Document Hyperlinks
        if (colKey && docKeys.includes(colKey)) {
          const cellValue = cell.value as any;
          if (cellValue && typeof cellValue === 'object' && 'hyperlink' in cellValue) {
            cell.font = {
              color: { argb: '2563EB' },
              underline: true,
              bold: true
            };
            cell.alignment = {
              vertical: 'middle' as const,
              horizontal: 'center' as const
            };
          }
        }

        // Raw Links
        if (colKey && colKey.endsWith('Link')) {
          const cellVal = cell.value as string;
          if (cellVal && typeof cellVal === 'string' && cellVal.trim() !== '' && cellVal !== '-') {
            cell.font = {
              color: { argb: '2563EB' },
              underline: true
            };
            cell.alignment = {
              vertical: 'middle' as const,
              horizontal: 'left' as const,
              wrapText: true
            };
          }
        }

        if (colKey === 'adminName') {
          cell.font = { 
            color: { argb: '1F2937' }, 
            bold: true 
          };
        }
      });
    }
  });


};

export const exportPendaftarToExcel = async (allData: PPDBData[], userRole: any, mode: 'regular' | 'pjj') => {
  try {
    const workbook = new ExcelJS.Workbook();

    if (userRole?.isMaster) {
      const dataModalBangsa = allData.filter(item => item.school === 'mosa');
      const dataFajarHarapan = allData.filter(item => item.school === 'fajar');

      const dataModalBangsaPrestasi = dataModalBangsa.filter(item => item.jalur === 'prestasi');
      const dataModalBangsaReguler = dataModalBangsa.filter(item => item.jalur === 'reguler');
      const dataModalBangsaUndangan = dataModalBangsa.filter(item => item.jalur === 'undangan');
      const dataModalBangsaPjj = dataModalBangsa.filter(item => item.jalur === 'pjj');

      const dataFajarHarapanPrestasi = dataFajarHarapan.filter(item => item.jalur === 'prestasi');
      const dataFajarHarapanReguler = dataFajarHarapan.filter(item => item.jalur === 'reguler');
      const dataFajarHarapanUndangan = dataFajarHarapan.filter(item => item.jalur === 'undangan');
      const dataFajarHarapanPjj = dataFajarHarapan.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Semua Data', allData, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Semua', dataModalBangsa, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Prestasi', dataModalBangsaPrestasi, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Reguler', dataModalBangsaReguler, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Undangan', dataModalBangsaUndangan, mode);
      setupWorksheet(workbook, 'Modal Bangsa - PJJ', dataModalBangsaPjj, mode);

      setupWorksheet(workbook, 'Fajar Harapan - Semua', dataFajarHarapan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Prestasi', dataFajarHarapanPrestasi, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Reguler', dataFajarHarapanReguler, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Undangan', dataFajarHarapanUndangan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - PJJ', dataFajarHarapanPjj, mode);
    } else {
      const schoolName = userRole?.school === 'mosa' ? 'Modal Bangsa' : 'Fajar Harapan';
      
      const dataPrestasi = allData.filter(item => item.jalur === 'prestasi');
      const dataReguler = allData.filter(item => item.jalur === 'reguler');
      const dataUndangan = allData.filter(item => item.jalur === 'undangan');
      const dataPjj = allData.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Semua Data', allData, mode);
      setupWorksheet(workbook, `${schoolName} - Prestasi`, dataPrestasi, mode);
      setupWorksheet(workbook, `${schoolName} - Reguler`, dataReguler, mode);
      setupWorksheet(workbook, `${schoolName} - Undangan`, dataUndangan, mode);
      setupWorksheet(workbook, `${schoolName} - PJJ`, dataPjj, mode);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const fileName = userRole?.isMaster 
      ? `Data_Pendaftar_PPDB_Semua_Sekolah_${new Date().toLocaleDateString('id-ID')}.xlsx`
      : `Data_Pendaftar_PPDB_${userRole?.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan'}_${new Date().toLocaleDateString('id-ID')}.xlsx`;

    saveAs(blob, fileName);
    showAlert('success', 'Data berhasil diexport ke Excel');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showAlert('error', 'Gagal mengexport data ke Excel');
  }
};

export const exportDraftToExcel = async (allData: PPDBData[], userRole: any, mode: 'regular' | 'pjj') => {
  try {
    const workbook = new ExcelJS.Workbook();

    if (userRole?.isMaster) {
      const dataModalBangsa = allData.filter(item => item.school === 'mosa');
      const dataFajarHarapan = allData.filter(item => item.school === 'fajar');

      const dataModalBangsaPrestasi = dataModalBangsa.filter(item => item.jalur === 'prestasi');
      const dataModalBangsaReguler = dataModalBangsa.filter(item => item.jalur === 'reguler');
      const dataModalBangsaUndangan = dataModalBangsa.filter(item => item.jalur === 'undangan');
      const dataModalBangsaPjj = dataModalBangsa.filter(item => item.jalur === 'pjj');

      const dataFajarHarapanPrestasi = dataFajarHarapan.filter(item => item.jalur === 'prestasi');
      const dataFajarHarapanReguler = dataFajarHarapan.filter(item => item.jalur === 'reguler');
      const dataFajarHarapanUndangan = dataFajarHarapan.filter(item => item.jalur === 'undangan');
      const dataFajarHarapanPjj = dataFajarHarapan.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Semua Draft', allData, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Semua', dataModalBangsa, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Prestasi', dataModalBangsaPrestasi, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Reguler', dataModalBangsaReguler, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Undangan', dataModalBangsaUndangan, mode);
      setupWorksheet(workbook, 'Modal Bangsa - PJJ', dataModalBangsaPjj, mode);

      setupWorksheet(workbook, 'Fajar Harapan - Semua', dataFajarHarapan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Prestasi', dataFajarHarapanPrestasi, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Reguler', dataFajarHarapanReguler, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Undangan', dataFajarHarapanUndangan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - PJJ', dataFajarHarapanPjj, mode);
    } else {
      const schoolName = userRole?.school === 'mosa' ? 'Modal Bangsa' : 'Fajar Harapan';
      
      const dataPrestasi = allData.filter(item => item.jalur === 'prestasi');
      const dataReguler = allData.filter(item => item.jalur === 'reguler');
      const dataUndangan = allData.filter(item => item.jalur === 'undangan');
      const dataPjj = allData.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Semua Draft', allData, mode);
      setupWorksheet(workbook, `${schoolName} - Prestasi`, dataPrestasi, mode);
      setupWorksheet(workbook, `${schoolName} - Reguler`, dataReguler, mode);
      setupWorksheet(workbook, `${schoolName} - Undangan`, dataUndangan, mode);
      setupWorksheet(workbook, `${schoolName} - PJJ`, dataPjj, mode);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const suffix = mode === 'pjj' ? '_PJJ' : '_Reguler';
    const fileName = userRole?.isMaster 
      ? `Data_Draft_PPDB_Semua_Sekolah${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`
      : `Data_Draft_PPDB_${userRole?.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan'}${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`;

    saveAs(blob, fileName);
    showAlert('success', 'Data draft berhasil diexport ke Excel');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    showAlert('error', 'Gagal mengexport data draft ke Excel');
  }
};

export const exportCombinedToExcel = async (allData: PPDBData[], userRole: any, mode: 'regular' | 'pjj') => {
  try {
    const workbook = new ExcelJS.Workbook();

    if (userRole?.isMaster) {
      const dataModalBangsa = allData.filter(item => item.school === 'mosa');
      const dataFajarHarapan = allData.filter(item => item.school === 'fajar');

      const dataModalBangsaPrestasi = dataModalBangsa.filter(item => item.jalur === 'prestasi');
      const dataModalBangsaReguler = dataModalBangsa.filter(item => item.jalur === 'reguler');
      const dataModalBangsaUndangan = dataModalBangsa.filter(item => item.jalur === 'undangan');
      const dataModalBangsaPjj = dataModalBangsa.filter(item => item.jalur === 'pjj');

      const dataFajarHarapanPrestasi = dataFajarHarapan.filter(item => item.jalur === 'prestasi');
      const dataFajarHarapanReguler = dataFajarHarapan.filter(item => item.jalur === 'reguler');
      const dataFajarHarapanUndangan = dataFajarHarapan.filter(item => item.jalur === 'undangan');
      const dataFajarHarapanPjj = dataFajarHarapan.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Gabungan - Semua Data', allData, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Semua', dataModalBangsa, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Prestasi', dataModalBangsaPrestasi, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Reguler', dataModalBangsaReguler, mode);
      setupWorksheet(workbook, 'Modal Bangsa - Undangan', dataModalBangsaUndangan, mode);
      setupWorksheet(workbook, 'Modal Bangsa - PJJ', dataModalBangsaPjj, mode);

      setupWorksheet(workbook, 'Fajar Harapan - Semua', dataFajarHarapan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Prestasi', dataFajarHarapanPrestasi, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Reguler', dataFajarHarapanReguler, mode);
      setupWorksheet(workbook, 'Fajar Harapan - Undangan', dataFajarHarapanUndangan, mode);
      setupWorksheet(workbook, 'Fajar Harapan - PJJ', dataFajarHarapanPjj, mode);
    } else {
      const schoolName = userRole?.school === 'mosa' ? 'Modal Bangsa' : 'Fajar Harapan';
      
      const dataPrestasi = allData.filter(item => item.jalur === 'prestasi');
      const dataReguler = allData.filter(item => item.jalur === 'reguler');
      const dataUndangan = allData.filter(item => item.jalur === 'undangan');
      const dataPjj = allData.filter(item => item.jalur === 'pjj');

      setupWorksheet(workbook, 'Gabungan - Semua Data', allData, mode);
      setupWorksheet(workbook, `${schoolName} - Prestasi`, dataPrestasi, mode);
      setupWorksheet(workbook, `${schoolName} - Reguler`, dataReguler, mode);
      setupWorksheet(workbook, `${schoolName} - Undangan`, dataUndangan, mode);
      setupWorksheet(workbook, `${schoolName} - PJJ`, dataPjj, mode);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });

    const suffix = mode === 'pjj' ? '_PJJ' : '_Reguler';
    const fileName = userRole?.isMaster 
      ? `Data_Gabungan_Pendaftar_dan_Draft_PPDB_Semua_Sekolah${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`
      : `Data_Gabungan_Pendaftar_dan_Draft_PPDB_${userRole?.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan'}${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`;

    saveAs(blob, fileName);
    showAlert('success', 'Data gabungan (pendaftar + draft) berhasil diexport ke Excel');
  } catch (error) {
    console.error('Error exporting combined data to Excel:', error);
    showAlert('error', 'Gagal mengexport data gabungan ke Excel');
  }
};

export const exportToCSV = (allData: PPDBData[], title: string = 'Data_Pendaftar_PPDB') => {
  try {
    const headers = [
      'No',
      'No. Pendaftaran',
      'NISN',
      'Nama Lengkap',
      'Email',
      'Jalur',
      'Status Kelengkapan',
      'Status',
      'Daftar Ulang',
      'Pemeriksa',
      'Alasan Penolakan',
      'NIK',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Alamat',
      'Kecamatan',
      'Kabupaten',
      'Asal Sekolah',
      'Alasan Memilih Sekolah',
      'Nama Ayah',
      'No HP Ayah',
      'Nama Ibu',
      'No HP Ibu',
      'Tanggal Daftar'
    ];

    const rows = allData.map((item, index) => [
      index + 1,
      `"${(item.registrationNumber || '-').replace(/"/g, '""')}"`,
      `"${(item.nisn || '-').replace(/"/g, '""')}"`,
      `"${(item.namaSiswa || '-').replace(/"/g, '""')}"`,
      `"${(item.email || '-').replace(/"/g, '""')}"`,
      `"${item.jalur ? getJalurLabel(item.jalur) : '-'}"`,
      `"${getStatusKelengkapan(item)}"`,
      `"${item.status === 'draft' ? 'DRAFT' : (item.adminStatus ? (item.adminStatus === 'diterima' ? 'DITERIMA' : 'DITOLAK') : 'PENDING')}"`,
      `"${item.adminStatus === 'diterima' ? (item.reRegistered ? 'Sudah' : 'Belum') : '-'}"`,
      `"${(item.updatedBy?.name || item.updatedBy?.email?.split('@')[0] || '-').replace(/"/g, '""')}"`,
      `"${(item.alasanPenolakan || '-').replace(/"/g, '""')}"`,
      `"${(item.nik || '-').replace(/"/g, '""')}"`,
      `"${item.jenisKelamin === 'L' ? 'Laki-laki' : (item.jenisKelamin === 'P' ? 'Perempuan' : '-')}"`,
      `"${(item.tempatLahir || '-').replace(/"/g, '""')}"`,
      `"${item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString('id-ID') : '-'}"`,
      `"${(item.alamat || '-').replace(/"/g, '""')}"`,
      `"${(item.kecamatan || '-').replace(/"/g, '""')}"`,
      `"${(item.kabupaten || '-').replace(/"/g, '""')}"`,
      `"${(item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : (item.asalSekolah || '-')).replace(/"/g, '""')}"`,
      `"${(item.alasanPilihan || '-').replace(/"/g, '""')}"`,
      `"${(item.namaAyah || '-').replace(/"/g, '""')}"`,
      `"${(item.hpAyah || '-').replace(/"/g, '""')}"`,
      `"${(item.namaIbu || '-').replace(/"/g, '""')}"`,
      `"${(item.hpIbu || '-').replace(/"/g, '""')}"`,
      `"${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${title}_${new Date().toLocaleDateString('id-ID')}.csv`);
    showAlert('success', 'Data berhasil diexport ke file CSV');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    showAlert('error', 'Gagal mengexport data ke CSV');
  }
};

