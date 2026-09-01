import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import { PPDBData } from '../types/ppdb';
import { getJalurLabel } from '../components/admin/AdminBadges';
import { getStatusKelengkapan } from '../components/admin/utils/exportExcel';
import { showAlert } from '../components/ui/Alert';

export const getGoogleAppsScriptTemplate = (accountEmail = 'alfaruqasri@sman-modalbangsa.sch.id') => {
  return `/**
 * Google Apps Script Webhook untuk PPDB Realtime Sync
 * Pemilik Akun: ${accountEmail}
 *
 * FITUR TERBARU:
 * 1. Batch High-Speed Sync (Mencegah Timeout saat Sync Banyak Data)
 * 2. Multi-Tab Otomatis: "Semua Data", "Diterima", "Pending", "Draft", "Ditolak"
 * 3. Format Sel Rapi: Warna Badge Status & Jalur, Header Slate, Tinggi Baris Sesuai
 * 4. Text Format NIK & NISN: Mencegah NIK berubah menjadi format eksponensial (1.10814E+15)
 * 5. Freeze Panes: Membekukan Header & 4 Kolom Pertama (No, RegNo, NISN, Nama)
 */

function doPost(e) {
  try {
    var rawText = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
    var contents = rawText ? JSON.parse(rawText) : {};

    var targetUrl = contents.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1m_-yv4SjDhwMI6xD8svvpReX6Z-IfwaDYmSpShgqGx4/edit";
    var ss = null;
    if (targetUrl) {
      try { ss = SpreadsheetApp.openByUrl(targetUrl); } catch(uErr) {}
    }
    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "Active spreadsheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var items = contents.batchData || (contents.data ? [contents.data] : [contents]);
    
    // 1. Kelola Sheet Tabs
    var tabNames = ["Semua Data", "Diterima", "Pending", "Draft", "Ditolak"];
    tabNames.forEach(function(tName) {
      var sh = ss.getSheetByName(tName);
      if (!sh) {
        sh = ss.insertSheet(tName);
      }
      setupSheetHeaderAndStyle(sh);
    });

    // 2. Jika Batch Sync (Sinkronkan Semua Data), hapus filter & hapus baris data lama (selain header)
    if (contents.batchData) {
      tabNames.forEach(function(tName) {
        var sh = ss.getSheetByName(tName);
        if (sh) {
          if (sh.getFilter()) {
            try { sh.getFilter().remove(); } catch(fErr) {}
          }
          if (sh.getLastRow() > 1) {
            sh.deleteRows(2, sh.getLastRow() - 1);
          }
        }
      });
    }

    // 3. Kelompokkan Data per Tab untuk penulisan cepat (Batch Write)
    var tabDataMap = {
      "Semua Data": [],
      "Diterima": [],
      "Pending": [],
      "Draft": [],
      "Ditolak": []
    };

    items.forEach(function(data) {
      var status = (data.statusKeputusan || 'PENDING').toUpperCase();
      tabDataMap["Semua Data"].push(data);
      if (status === 'DITERIMA') {
        tabDataMap["Diterima"].push(data);
      } else if (status === 'DITOLAK') {
        tabDataMap["Ditolak"].push(data);
      } else if (status === 'DRAFT') {
        tabDataMap["Draft"].push(data);
      } else {
        tabDataMap["Pending"].push(data);
      }
    });

    // Tulis data batch ke masing-masing tab secara kolektif
    tabNames.forEach(function(tName) {
      var list = tabDataMap[tName];
      if (list && list.length > 0) {
        appendBatchStyledRows(ss.getSheetByName(tName), list);
      }
    });

    // Hapus sheet bawaan (Sheet1, Lembar1, Sheet3, dll) jika sudah ada tab PPDB
    var allSheets = ss.getSheets();
    if (allSheets.length > 1) {
      allSheets.forEach(function(sh) {
        var sName = sh.getName();
        if ((sName.indexOf("Sheet") === 0 || sName.indexOf("Lembar") === 0) && tabNames.indexOf(sName) === -1) {
          try { ss.deleteSheet(sh); } catch(delErr) {}
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSheetHeaderAndStyle(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      "No",
      "No. Pendaftaran",
      "NISN",
      "Nama Siswa",
      "Email",
      "Jalur",
      "Status Kelengkapan",
      "Status Keputusan",
      "Daftar Ulang",
      "Pemeriksa",
      "Alasan Penolakan",
      "Asal Sekolah",
      "NIK",
      "Jenis Kelamin",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Alamat",
      "Nama Ayah",
      "No HP Ayah",
      "Nama Ibu",
      "No HP Ibu",
      "Waktu Sync"
    ];
    sheet.appendRow(headers);
    
    // Style Header
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1E293B");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 30);

    // Freeze 1 Baris Atas & 4 Kolom Kiri
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(4);

    // Lebar Kolom Nyaman
    var widths = [45, 170, 130, 240, 210, 110, 140, 120, 110, 170, 220, 240, 160, 110, 150, 110, 260, 190, 140, 190, 140, 160];
    widths.forEach(function(w, i) {
      sheet.setColumnWidth(i + 1, w);
    });
  }
}

function appendBatchStyledRows(sheet, items) {
  if (!sheet || !items || items.length === 0) return;

  var startRow = sheet.getLastRow() + 1;
  var rows = items.map(function(data, idx) {
    var nextNo = (startRow - 1) + idx;
    var regNoVal = data.registrationNumber || "-";
    var nisnVal = data.nisn || "-";
    var nikVal = data.nik || "-";

    return [
      nextNo,
      regNoVal,
      nisnVal,
      data.namaSiswa || "-",
      data.email || "-",
      data.jalurLabel || data.jalur || "-",
      data.statusKelengkapan || "-",
      data.statusKeputusan || "PENDING",
      data.reRegistered || "-",
      data.adminName || "-",
      data.alasanPenolakan || "-",
      data.asalSekolah || "-",
      nikVal,
      data.jenisKelamin === 'L' ? 'Laki-laki' : (data.jenisKelamin === 'P' ? 'Perempuan' : '-'),
      data.tempatLahir || "-",
      data.tanggalLahir || "-",
      data.alamat || "-",
      data.namaAyah || "-",
      data.hpAyah || "-",
      data.namaIbu || "-",
      data.hpIbu || "-",
      new Date().toLocaleString("id-ID")
    ];
  });

  var numRows = rows.length;
  var numCols = rows[0].length;
  var range = sheet.getRange(startRow, 1, numRows, numCols);
  range.setValues(rows);
  range.setFontColor("#0F172A").setFontWeight("normal").setBackground("#FFFFFF");

  sheet.setRowHeights(startRow, numRows, 24);

  // Format Teks Murni untuk NISN, NIK, No Pendaftaran
  sheet.getRange(startRow, 2, numRows, 1).setNumberFormat("@").setHorizontalAlignment("center");
  sheet.getRange(startRow, 3, numRows, 1).setNumberFormat("@").setHorizontalAlignment("center");
  sheet.getRange(startRow, 13, numRows, 1).setNumberFormat("@");

  // Rata Tengah Kolom Pilihan
  sheet.getRange(startRow, 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 6, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 7, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 8, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 9, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, 14, numRows, 1).setHorizontalAlignment("center");

  // Warna Badge per Baris
  items.forEach(function(data, idx) {
    var rowIdx = startRow + idx;

    // Warna Badge Status (Kolom 8)
    var statusCell = sheet.getRange(rowIdx, 8);
    var st = (data.statusKeputusan || 'PENDING').toUpperCase();
    if (st === 'DITERIMA') {
      statusCell.setBackground("#DCFCE7").setFontColor("#166534").setFontWeight("bold");
    } else if (st === 'DITOLAK') {
      statusCell.setBackground("#FEE2E2").setFontColor("#B91C1C").setFontWeight("bold");
    } else if (st === 'DRAFT') {
      statusCell.setBackground("#E0E7FF").setFontColor("#3730A3").setFontWeight("bold");
    } else {
      statusCell.setBackground("#FEF3C7").setFontColor("#B45309").setFontWeight("bold");
    }

    // Warna Badge Jalur (Kolom 6)
    var jalurCell = sheet.getRange(rowIdx, 6);
    var jl = (data.jalurLabel || data.jalur || '').toUpperCase();
    if (jl.indexOf('PRESTASI') !== -1) {
      jalurCell.setBackground("#DBEAFE").setFontColor("#1E40AF").setFontWeight("bold");
    } else if (jl.indexOf('REGULER') !== -1) {
      jalurCell.setBackground("#DCFCE7").setFontColor("#166534").setFontWeight("bold");
    } else if (jl.indexOf('UNDANGAN') !== -1) {
      jalurCell.setBackground("#F3E8FF").setFontColor("#6B21A8").setFontWeight("bold");
    } else if (jl.indexOf('PJJ') !== -1) {
      jalurCell.setBackground("#FEF3C7").setFontColor("#B45309").setFontWeight("bold");
    }
  });
}
`;
};

export const formatItemForSheet = (item: PPDBData) => ({
  registrationNumber: item.registrationNumber || '-',
  nisn: item.nisn || '-',
  namaSiswa: item.namaSiswa || '-',
  email: item.email || '-',
  jalur: item.jalur || '-',
  jalurLabel: item.jalur ? getJalurLabel(item.jalur) : '-',
  statusKelengkapan: getStatusKelengkapan(item),
  statusKeputusan: item.status === 'draft' ? 'DRAFT' : (item.adminStatus ? (item.adminStatus === 'diterima' ? 'DITERIMA' : 'DITOLAK') : 'PENDING'),
  reRegistered: item.adminStatus === 'diterima' ? (item.reRegistered ? 'Sudah' : 'Belum') : '-',
  adminName: item.updatedBy?.name || item.updatedBy?.email?.split('@')[0] || '-',
  alasanPenolakan: item.alasanPenolakan || '-',
  asalSekolah: item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : (item.asalSekolah || '-'),
  nik: item.nik || '-',
  jenisKelamin: item.jenisKelamin || '-',
  tempatLahir: item.tempatLahir || '-',
  tanggalLahir: item.tanggalLahir || '-',
  alamat: item.alamat || '-',
  namaAyah: item.namaAyah || '-',
  hpAyah: item.hpAyah || '-',
  namaIbu: item.namaIbu || '-',
  hpIbu: item.hpIbu || '-'
});

export const syncDataToGoogleSheets = async (item: PPDBData) => {
  try {
    const settingsRef = ref(db, 'settings/ppdb');
    const snapshot = await get(settingsRef);
    if (!snapshot.exists()) return;

    const settings = snapshot.val();
    const gsConfig = settings.googleSheets;

    let cleanUrl = (gsConfig.webhookUrl || '').trim();
    cleanUrl = cleanUrl.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');

    if (!cleanUrl.startsWith('https://script.google.com/macros/s/') || !cleanUrl.endsWith('/exec')) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      spreadsheetUrl: gsConfig.spreadsheetUrl || undefined,
      data: formatItemForSheet(item)
    };

    await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

  } catch (error) {
    console.error('Error syncing data to Google Sheets:', error);
  }
};

export const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1m_-yv4SjDhwMI6xD8svvpReX6Z-IfwaDYmSpShgqGx4/edit';

export const syncAllExistingDataToGoogleSheets = async (customWebhookUrl?: string, customData?: PPDBData[]) => {
  try {
    let webhookUrl = customWebhookUrl;
    let spreadsheetUrl: string | undefined = undefined;

    const settingsRef = ref(db, 'settings/ppdb');
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      const gsConfig = snapshot.val().googleSheets;
      if (gsConfig) {
        if (!webhookUrl && gsConfig.isEnabled) {
          webhookUrl = gsConfig.webhookUrl;
        }
        spreadsheetUrl = gsConfig.spreadsheetUrl;
      }
    }

    if (!spreadsheetUrl) {
      spreadsheetUrl = DEFAULT_SPREADSHEET_URL;
    }

    if (!webhookUrl) {
      showAlert('error', 'Google Sheets Webhook URL belum diisi atau integrasi belum diaktifkan!');
      return false;
    }

    let cleanUrl = webhookUrl.trim();
    // Otomatis bersihkan prefix multi-akun Google (/u/1/, /u/2/, dst)
    cleanUrl = cleanUrl.replace(/\/macros\/u\/\d+\/s\//, '/macros/s/');

    if (!cleanUrl.startsWith('https://script.google.com/macros/s/') || !cleanUrl.endsWith('/exec')) {
      showAlert('error', 'Google Apps Script Webhook URL tidak valid! URL harus diawali dengan "https://script.google.com/macros/s/..." dan berakhiran "/exec"');
      return false;
    }

    let allData: PPDBData[] = [];

    if (customData && customData.length > 0) {
      allData = customData;
    } else {
      showAlert('info', 'Sedang mengambil semua data pendaftar dari database...', 3000);

      const mosaRef = ref(db, 'ppdb_mosa');
      const fajarRef = ref(db, 'ppdb_fajar');

      const [mosaSnapshot, fajarSnapshot] = await Promise.all([
        get(mosaRef),
        get(fajarRef)
      ]);

      const mosaData: PPDBData[] = mosaSnapshot.exists()
        ? Object.entries(mosaSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'mosa' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          }))
        : [];

      const fajarData: PPDBData[] = fajarSnapshot.exists()
        ? Object.entries(fajarSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'fajar' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          }))
        : [];

      allData = [...mosaData, ...fajarData];
    }

    if (allData.length === 0) {
      showAlert('warning', 'Tidak ada data pendaftar di database untuk disinkronkan.');
      return false;
    }

    showAlert('info', `Sedang mengirim ${allData.length} data pendaftar ke Google Sheets...`, 4000);

    const batchFormattedData = allData.map(formatItemForSheet);

    const payload = {
      timestamp: new Date().toISOString(),
      spreadsheetUrl: spreadsheetUrl || undefined,
      batchData: batchFormattedData
    };

    await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    showAlert('success', `Berhasil mengirim ${allData.length} data pendaftar ke Google Sheets!`);
    return true;

  } catch (error: any) {
    console.error('Error batch syncing to Google Sheets:', error);
    showAlert('error', `Gagal mengirim data ke Google Sheets: ${error.message || 'Network error'}`);
    return false;
  }
};
