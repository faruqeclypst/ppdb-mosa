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

  // Styling untuk header
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '4B5563' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  };

  const isPJJ = mode === 'pjj';
  
  const baseColumns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'No. Pendaftaran', key: 'registrationNumber', width: 20 },
    { header: 'NISN', key: 'nisn', width: 15 },
    { header: 'Nama Lengkap', key: 'namaSiswa', width: 40 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Jalur', key: 'jalur', width: 15 },
    { header: 'Status', key: 'statusKeputusan', width: 15 },
    { header: 'Daftar Ulang', key: 'reRegistered', width: 15 },
    { header: 'Waktu Daftar Ulang', key: 'reRegisteredAt', width: 25 },
    { header: 'Pemeriksa', key: 'adminName', width: 25 },
    { header: 'Alasan Penolakan', key: 'alasanPenolakan', width: 50 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
    { header: 'Tempat Lahir', key: 'tempatLahir', width: 30 },
    { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
    { header: 'Anak Ke', key: 'anakKe', width: 10 },
    { header: 'Jumlah Saudara', key: 'jumlahSaudara', width: 18 },
    { header: 'Alamat', key: 'alamat', width: 50 },
    { header: 'Kecamatan', key: 'kecamatan', width: 25 },
    { header: 'Kabupaten', key: 'kabupaten', width: 25 },
    { header: 'Asal Sekolah', key: 'asalSekolah', width: 40 },
    ...(isPJJ ? [{ header: 'Sekolah PJJ', key: 'pjjSchool', width: 40 }] : [])
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
    { header: 'Nama Ayah', key: 'namaAyah', width: 40 },
    { header: 'Pekerjaan Ayah', key: 'pekerjaanAyah', width: 30 },
    { header: 'Instansi Ayah', key: 'instansiAyah', width: 40 },
    { header: 'No HP Ayah', key: 'hpAyah', width: 18 },
    { header: 'Nama Ibu', key: 'namaIbu', width: 40 },
    { header: 'Pekerjaan Ibu', key: 'pekerjaanIbu', width: 30 },
    { header: 'Instansi Ibu', key: 'instansiIbu', width: 40 },
    { header: 'No HP Ibu', key: 'hpIbu', width: 18 },
  ];

  let docColumns: any[] = [];
  let rawLinkColumns: any[] = [];
  if (isPJJ) {
    docColumns = [
      { header: 'Foto', key: 'photo', width: 15 },
      { header: 'FC Ijazah', key: 'ijazah', width: 15 },
      { header: 'Kartu Keluarga', key: 'kartuKeluarga', width: 15 },
      { header: 'Akta Kelahiran', key: 'aktaKelahiran', width: 15 },
      { header: 'Lampiran A', key: 'lampiranA', width: 15 },
      { header: 'Lampiran B', key: 'lampiranB', width: 15 },
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
      { header: 'Foto', key: 'photo', width: 15 },
      { header: 'Rekomendasi', key: 'rekomendasi', width: 15 },
      { header: 'Raport 2', key: 'raport2', width: 15 },
      { header: 'Raport 3', key: 'raport3', width: 15 },
      { header: 'Raport 4', key: 'raport4', width: 15 },
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
    { header: 'Tanggal Daftar', key: 'createdAt', width: 20 },
    { header: 'Terakhir Diupdate', key: 'lastUpdated', width: 20 },
    { header: 'Diupdate Oleh', key: 'updatedByEmail', width: 30 },
    { header: 'Admin Sekolah', key: 'updatedBySchool', width: 25 },
    { header: 'Waktu Update', key: 'updatedByTime', width: 20 },
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

  // Apply header styling
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  // Freeze panes to include the Pemeriksa column
  worksheet.views = [{
    state: 'frozen',
    xSplit: 7,
    ySplit: 1,
    activeCell: 'A2'
  }];

  const rowData = data.map((item, index) => {
    const baseData = {
      no: index + 1,
      registrationNumber: item.registrationNumber || '-',
      nisn: item.nisn,
      namaSiswa: item.namaSiswa,
      email: item.email,
      jalur: item.jalur ? getJalurLabel(item.jalur) : '-',
      statusKeputusan: item.adminStatus ? 
        (item.adminStatus === 'diterima' ? 'DITERIMA' : 'DITOLAK') : 
        'PENDING',
      reRegistered: item.adminStatus === 'diterima' ? (item.reRegistered ? 'Sudah' : 'Belum') : '-',
      reRegisteredAt: item.reRegisteredAt ? new Date(item.reRegisteredAt).toLocaleString('id-ID') : '-',
      adminName: item.updatedBy?.name || item.updatedBy?.email.split('@')[0] || '-',
      alasanPenolakan: item.alasanPenolakan || '-',
      nik: item.nik,
      jenisKelamin: item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      tempatLahir: item.tempatLahir,
      tanggalLahir: new Date(item.tanggalLahir).toLocaleDateString('id-ID'),
      anakKe: item.anakKe,
      jumlahSaudara: item.jumlahSaudara,
      alamat: item.alamat,
      kecamatan: item.kecamatan,
      kabupaten: item.kabupaten,
      asalSekolah: item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah,
      pjjSchool: item.pjjSchool || '-'
    };

    let academicData = {};
    if (!isPJJ) {
      academicData = {
        nilaiAgama2: item.nilaiAgama2,
        nilaiAgama3: item.nilaiAgama3,
        nilaiAgama4: item.nilaiAgama4,
        nilaiBindo2: item.nilaiBindo2,
        nilaiBindo3: item.nilaiBindo3,
        nilaiBindo4: item.nilaiBindo4,
        nilaiBing2: item.nilaiBing2,
        nilaiBing3: item.nilaiBing3,
        nilaiBing4: item.nilaiBing4,
        nilaiMtk2: item.nilaiMtk2,
        nilaiMtk3: item.nilaiMtk3,
        nilaiMtk4: item.nilaiMtk4,
        nilaiIpa2: item.nilaiIpa2,
        nilaiIpa3: item.nilaiIpa3,
        nilaiIpa4: item.nilaiIpa4,
      };
    }

    const parentData = {
      namaAyah: item.namaAyah,
      pekerjaanAyah: item.pekerjaanAyah,
      instansiAyah: item.instansiAyah,
      hpAyah: item.hpAyah,
      namaIbu: item.namaIbu,
      pekerjaanIbu: item.pekerjaanIbu,
      instansiIbu: item.instansiIbu,
      hpIbu: item.hpIbu,
    };

    let documentData = {};
    if (isPJJ) {
      documentData = {
        photo: {
          text: item.photo ? 'Lihat Foto' : '-',
          hyperlink: item.photo || '',
          tooltip: 'Klik untuk melihat pas foto'
        },
        ijazah: {
          text: item.ijazah ? 'Lihat Ijazah' : '-',
          hyperlink: item.ijazah || '',
          tooltip: 'Klik untuk melihat FC Ijazah'
        },
        kartuKeluarga: {
          text: item.kartuKeluarga ? 'Lihat KK' : '-',
          hyperlink: item.kartuKeluarga || '',
          tooltip: 'Klik untuk melihat Kartu Keluarga'
        },
        aktaKelahiran: {
          text: item.aktaKelahiran ? 'Lihat Akta' : '-',
          hyperlink: item.aktaKelahiran || '',
          tooltip: 'Klik untuk melihat Akta Kelahiran'
        },
        lampiranA: {
          text: item.lampiranA ? 'Lihat Lampiran A' : '-',
          hyperlink: item.lampiranA || '',
          tooltip: 'Klik untuk melihat Lampiran A'
        },
        lampiranB: {
          text: item.lampiranB ? 'Lihat Lampiran B' : '-',
          hyperlink: item.lampiranB || '',
          tooltip: 'Klik untuk melihat Lampiran B'
        },
        photoLink: item.photo || '-',
        ijazahLink: item.ijazah || '-',
        kartuKeluargaLink: item.kartuKeluarga || '-',
        aktaKelahiranLink: item.aktaKelahiran || '-',
        lampiranALink: item.lampiranA || '-',
        lampiranBLink: item.lampiranB || '-',
      };
    } else {
      documentData = {
        photo: {
          text: item.photo ? 'Lihat Dokumen' : '-',
          hyperlink: item.photo || '',
          tooltip: 'Klik untuk melihat dokumen'
        },
        rekomendasi: {
          text: item.rekomendasi ? 'Lihat Dokumen' : '-',
          hyperlink: item.rekomendasi || '',
          tooltip: 'Klik untuk melihat dokumen'
        },
        raport2: {
          text: item.raport2 ? 'Lihat Dokumen' : '-',
          hyperlink: item.raport2 || '',
          tooltip: 'Klik untuk melihat dokumen'
        },
        raport3: {
          text: item.raport3 ? 'Lihat Dokumen' : '-',
          hyperlink: item.raport3 || '',
          tooltip: 'Klik untuk melihat dokumen'
        },
        raport4: {
          text: item.raport4 ? 'Lihat Dokumen' : '-',
          hyperlink: item.raport4 || '',
          tooltip: 'Klik untuk melihat dokumen'
        },
        photoLink: item.photo || '-',
        rekomendasiLink: item.rekomendasi || '-',
        raport2Link: item.raport2 || '-',
        raport3Link: item.raport3 || '-',
        raport4Link: item.raport4 || '-',
      };
    }

    const metadataData = {
      createdAt: new Date(item.createdAt).toLocaleString('id-ID'),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-',
      updatedByEmail: item.updatedBy?.name || item.updatedBy?.email.split('@')[0] || '-',
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
    'jalur',
    'statusKeputusan',
    'reRegistered',
    'reRegisteredAt',
    'jenisKelamin',
    'anakKe',
    'jumlahSaudara',
    'nilaiAgama2', 'nilaiAgama3', 'nilaiAgama4',
    'nilaiBindo2', 'nilaiBindo3', 'nilaiBindo4',
    'nilaiBing2', 'nilaiBing3', 'nilaiBing4',
    'nilaiMtk2', 'nilaiMtk3', 'nilaiMtk4',
    'nilaiIpa2', 'nilaiIpa3', 'nilaiIpa4',
    'photo',
    'rekomendasi',
    'raport2',
    'raport3',
    'raport4',
    'ijazah',
    'kartuKeluarga',
    'aktaKelahiran',
    'lampiranA',
    'lampiranB'
  ]);

  const docKeys = ['photo', 'rekomendasi', 'raport2', 'raport3', 'raport4', 'ijazah', 'kartuKeluarga', 'aktaKelahiran', 'lampiranA', 'lampiranB'];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row
      row.eachCell((cell, colNumber) => {
        const colDef = worksheet.columns[colNumber - 1];
        const colKey = colDef ? colDef.key : '';

        cell.border = {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        };

        cell.alignment = { vertical: 'middle' as const };

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
          }
        }

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

        if (colKey === 'alasanPenolakan') {
          cell.alignment = {
            vertical: 'middle' as const,
            wrapText: true
          };
        }

        if (colKey && docKeys.includes(colKey)) {
          const cellValue = cell.value as any;
          if (cellValue && typeof cellValue === 'object' && 'hyperlink' in cellValue) {
            cell.font = {
              color: { argb: '0000FF' },
              underline: true
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

  const lastRow = worksheet.lastRow!.number + 2;
  worksheet.addRow(['Total Data:', data.length]);
  worksheet.getRow(lastRow).font = { bold: true };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, colNumber) => {
        const colDef = worksheet.columns[colNumber - 1];
        const colKey = colDef ? colDef.key : '';
        
        if (colKey && colKey.endsWith('Link')) {
          cell.font = {
            color: { argb: '0000FF' },
            underline: true
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true
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
    const worksheet = workbook.addWorksheet('Data Draft');
    
    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'namaSiswa', width: 40 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'NISN', key: 'nisn', width: 20 },
      ...(mode === 'pjj' ? [{ header: 'Sekolah PJJ', key: 'pjjSchool', width: 40 }] : []),
      { header: 'Jalur', key: 'jalur', width: 15 },
      { header: 'Status Kelengkapan', key: 'statusKelengkapan', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Tanggal Buat', key: 'createdAt', width: 20 },
      { header: 'Terakhir Update', key: 'lastUpdated', width: 20 }
    ];

    worksheet.columns = columns;

    const rowData = allData.map((item, index) => ({
      no: index + 1,
      namaSiswa: item.namaSiswa || '-',
      email: item.email || '-',
      nisn: item.nisn || '-',
      pjjSchool: item.pjjSchool || '-',
      jalur: item.jalur ? getJalurLabel(item.jalur) : '-',
      statusKelengkapan: getStatusKelengkapan(item),
      status: item.status === 'draft' ? 'Draft' : 'Pending',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-',
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-'
    }));

    worksheet.addRows(rowData);

    // Apply basic header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4B5563' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
    });

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
