import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getPPDBYear } from './registrationNumber';

export interface PDFFormData {
  school: 'mosa' | 'fajar';
  jalur: string;
  pjjSchool?: string;
  namaSiswa: string;
  nisn: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  asalSekolah: string;
  asalSekolahManual?: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  namaAyah: string;
  namaIbu: string;
  hpAyah: string;
  registrationNumber?: string;
  photo?: File | string;
}


const wrapText = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text];

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines;
};

export const generateRegistrationCard = async (
  formData: PDFFormData,
  onShowAlert: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void
) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Border
    const borderMargin = 20;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    const marginX = 50;

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const isPJJ = formData.jalur.toLowerCase() === 'pjj';

    // Load school logo
    const logoPath = isPJJ || formData.school === 'mosa' ? '/images/mosa.png' : '/images/fajar.png';
    const logoResponse = await fetch(logoPath);
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoArrayBuffer);
    
    // Scale logo to height = 65px
    const logoHeight = 65;
    const logoDims = logoImage.scale(logoHeight / logoImage.height);

    // Header positioning
    const headerY = height - 55;
    const logoCenterY = headerY - (logoHeight / 2);

    // Draw school logo on the LEFT
    page.drawImage(logoImage, {
      x: marginX,
      y: logoCenterY - (logoDims.height / 2),
      width: logoDims.width,
      height: logoDims.height,
    });

    // Header text on the right side of the logo (perfectly vertically centered)
    const headerTextX = marginX + logoDims.width + 25;
    
    let textStartY = 0;
    if (isPJJ) {
      // 4 lines of text: total height = 3 * 14 + 11.5 = 53.5px. Center = logoCenterY.
      // Top of text block is at logoCenterY + 26.75. First line drawn from its baseline:
      // textStartY = logoCenterY + 26.75 - 11.5 * 0.72 = logoCenterY + 26.75 - 8.28 = logoCenterY + 18.47
      textStartY = logoCenterY + 18.47;
      
      page.drawText('PENERIMAAN PESERTA DIDIK BARU', {
        x: headerTextX,
        y: textStartY,
        size: 11.5,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText('PENDIDIKAN JARAK JAUH', {
        x: headerTextX,
        y: textStartY - 14,
        size: 11.5,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText('SMAN MODAL BANGSA', {
        x: headerTextX,
        y: textStartY - 28,
        size: 11.5,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      const { start, end } = getPPDBYear();
      page.drawText(`TAHUN PELAJARAN ${start}/${end}`, {
        x: headerTextX,
        y: textStartY - 42,
        size: 10,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    } else {
      // 3 lines of text: total height = 2 * 15 + 12.5 = 42.5px. Center = logoCenterY.
      // Top of text block is at logoCenterY + 21.25. First line drawn from its baseline:
      // textStartY = logoCenterY + 21.25 - 12.5 * 0.72 = logoCenterY + 21.25 - 9 = logoCenterY + 12.25
      textStartY = logoCenterY + 12.25;

      page.drawText('PENERIMAAN PESERTA DIDIK BARU', {
        x: headerTextX,
        y: textStartY,
        size: 12.5,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      const schoolName = formData.school === 'mosa' ? 'SMAN MODAL BANGSA' : 'SMAN 10 FAJAR HARAPAN';
      page.drawText(schoolName, {
        x: headerTextX,
        y: textStartY - 15,
        size: 12.5,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      const { start, end } = getPPDBYear();
      page.drawText(`TAHUN PELAJARAN ${start}/${end}`, {
        x: headerTextX,
        y: textStartY - 30,
        size: 10.5,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    // Separation line below the logo and text
    const lineY = logoCenterY - (logoHeight / 2) - 15;
    page.drawLine({
      start: { x: marginX, y: lineY },
      end: { x: width - marginX, y: lineY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Document Title (Centered)
    const titleY = lineY - 35;
    const titleText = 'BUKTI PENDAFTARAN';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 14);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: titleY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Photo area
    const photoWidth = 3 * 28.35;
    const photoHeight = 4 * 28.35;
    const photoX = width - photoWidth - marginX;
    const photoY = lineY - photoHeight - 20;

    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoWidth,
      height: photoHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.75,
    });

    let photoEmbedded = false;
    if (formData.photo) {
      try {
        let photoBytes: ArrayBuffer;

        if (formData.photo instanceof File) {
          photoBytes = await formData.photo.arrayBuffer();
        } else if (typeof formData.photo === 'string') {
          if (formData.photo.startsWith('data:')) {
            const base64Data = formData.photo.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            photoBytes = bytes.buffer;
          } else {
            const photoResponse = await fetch(formData.photo);
            photoBytes = await photoResponse.arrayBuffer();
          }
        } else {
          throw new Error('Invalid photo format');
        }

        if (photoBytes) {
          let photoImage;
          try {
            // Try to embed as JPG
            photoImage = await pdfDoc.embedJpg(photoBytes);
          } catch (jpgError) {
            // Fallback to PNG
            photoImage = await pdfDoc.embedPng(photoBytes);
          }

          if (photoImage) {
            page.drawImage(photoImage, {
              x: photoX,
              y: photoY,
              width: photoWidth,
              height: photoHeight,
            });
            photoEmbedded = true;
          }
        }
      } catch (err) {
        console.error('Error embedding photo:', err);
      }
    }

    if (!photoEmbedded) {
      const textColor = rgb(0.5, 0.5, 0.5);
      page.drawText('Tempel', {
        x: photoX + photoWidth / 2 - 12,
        y: photoY + photoHeight / 2 + 10,
        size: 8,
        font: helveticaFont,
        color: textColor,
      });

      page.drawText('Pas Foto 3x4', {
        x: photoX + photoWidth / 2 - 20,
        y: photoY + photoHeight / 2 - 5,
        size: 8,
        font: helveticaFont,
        color: textColor,
      });
    }

    const regNumber = formData.registrationNumber || '-';

    // Detail layout
    const startY = lineY - 80;
    const lineHeight = 25;
    let currentY = startY;

    const drawField = (label: string, value: string, y: number) => {
      page.drawText(label, {
        x: marginX,
        y,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText(': ' + value, {
        x: marginX + 150,
        y,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    };

    const fields = [
      { label: 'No. Pendaftaran', value: regNumber },
      { label: 'Jalur Pendaftaran', value: formData.jalur.toUpperCase() },
      ...(isPJJ ? [{ label: 'Sekolah PJJ', value: formData.pjjSchool || '-' }] : []),
      { label: 'Nama Lengkap', value: formData.namaSiswa },
      { label: 'NISN', value: formData.nisn },
      { label: 'NIK', value: formData.nik },
      { label: 'Tempat, Tgl Lahir', value: `${formData.tempatLahir}, ${new Date(formData.tanggalLahir).toLocaleDateString('id-ID')}` },
      { label: 'Jenis Kelamin', value: formData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
      { label: 'Asal Sekolah', value: formData.asalSekolah === 'SEKOLAH LAIN' ? (formData.asalSekolahManual || 'SEKOLAH LAIN') : formData.asalSekolah },
      { label: 'Alamat', value: `${formData.alamat}, ${formData.kecamatan}` },
      { label: 'Kabupaten/Kota', value: formData.kabupaten },
      { label: 'Nama Ayah', value: formData.namaAyah },
      { label: 'Nama Ibu', value: formData.namaIbu },
      { label: 'No. HP', value: formData.hpAyah }
    ];

    fields.forEach((field) => {
      drawField(field.label, field.value, currentY);
      currentY -= lineHeight;
    });

    // Notes
    currentY -= 30;
    page.drawText('Catatan:', {
      x: marginX,
      y: currentY,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    currentY -= 20;
    const noteText = isPJJ
      ? `Kartu ini sebagai bukti pendaftaran SPMB Pendidikan Jarak Jauh (PJJ) SMAN Modal Bangsa`
      : `Kartu ini sebagai bukti pendaftaran PPDB ${formData.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`;

    page.drawText(noteText, {
      x: marginX,
      y: currentY,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Signatures
    currentY -= 60;
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const drawSignatureBox = (x: number, y: number, width: number, label: string, name?: string) => {
      page.drawText(label, {
        x: x,
        y: y + 40,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText('(', {
        x: x,
        y: y - 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(')', {
        x: x + width - 5,
        y: y - 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      if (name) {
        const lines = wrapText(name, 25);
        lines.forEach((line, index) => {
          page.drawText(line, {
            x: x + 4,
            y: y - 21 - (index * 12),
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        });
      }
    };

    const signatureWidth = 140;
    const boxStartY = currentY - 40;
    const rightColumnX = width - marginX - signatureWidth;

    const location = formData.school === 'mosa' ? 'Aceh Besar' : 'Banda Aceh';
    const dateText = `${location}, ${today}`;

    page.drawText(dateText, {
      x: rightColumnX,
      y: currentY + 15,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    drawSignatureBox(
      rightColumnX,
      boxStartY,
      signatureWidth,
      'Pendaftar',
      formData.namaSiswa
    );

    const pdfBytes = await pdfDoc.save();
    const schoolAbbr = formData.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan';
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    saveAs(blob, `Kartu_Pendaftaran_${schoolAbbr}_${formData.namaSiswa}.pdf`);

  } catch (error) {
    onShowAlert('error', 'Gagal membuat bukti pendaftaran');
  }
};

export const generateReRegistrationCard = async (
  formData: any,
  onShowAlert: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void
) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Border
    const borderMargin = 20;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1.5,
    });

    const marginX = 50;

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load school logo
    const logoPath = formData.school === 'mosa' ? '/images/mosa.png' : '/images/fajar.png';
    const logoResponse = await fetch(logoPath);
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoArrayBuffer);
    const logoScale = formData.school === 'mosa' ? 0.09 : 0.15;
    const logoDims = logoImage.scale(logoScale);

    // Header positioning
    const headerY = height - 80;

    // Draw logo
    page.drawImage(logoImage, {
      x: marginX,
      y: headerY - logoDims.height / 2 - 5,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Header text
    const headerTextX = marginX + logoDims.width + 30;
    const isPJJ = formData.jalur?.toLowerCase() === 'pjj';

    if (isPJJ) {
      page.drawText('PANITIA PENERIMAAN PESERTA DIDIK BARU', {
        x: headerTextX,
        y: headerY + 20,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText('PENDIDIKAN JARAK JAUH (PJJ)', {
        x: headerTextX,
        y: headerY + 5,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText('SMAN MODAL BANGSA', {
        x: headerTextX,
        y: headerY - 10,
        size: 13,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
    } else {
      page.drawText('PANITIA PENERIMAAN PESERTA DIDIK BARU', {
        x: headerTextX,
        y: headerY + 15,
        size: 13,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      const schoolName = formData.school === 'mosa' ? 'SMAN MODAL BANGSA' : 'SMAN 10 FAJAR HARAPAN';
      page.drawText(schoolName, {
        x: headerTextX,
        y: headerY - 5,
        size: 13,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
    }

    const { start, end } = getPPDBYear();
    page.drawText(`TAHUN AJARAN ${start}/${end}`, {
      x: headerTextX,
      y: headerY - 25,
      size: 11,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Separation line
    const lineY = headerY - 45;
    page.drawLine({
      start: { x: marginX, y: lineY },
      end: { x: width - marginX, y: lineY },
      thickness: 1.5,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Title
    page.drawText('BUKTI PENDAFTARAN ULANG (DAFTAR ULANG)', {
      x: (width - helveticaBold.widthOfTextAtSize('BUKTI PENDAFTARAN ULANG (DAFTAR ULANG)', 13)) / 2,
      y: lineY - 30,
      size: 13,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Subtitle
    const subText = 'Tanda bukti ini wajib dibawa pada saat penyerahan berkas fisik.';
    page.drawText(subText, {
      x: (width - helveticaFont.widthOfTextAtSize(subText, 9)) / 2,
      y: lineY - 45,
      size: 9,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Information Section
    const infoStartY = lineY - 80;
    const infoLineHeight = 20;
    let currentY = infoStartY;

    const drawInfoField = (label: string, value: string, y: number) => {
      page.drawText(label, {
        x: marginX,
        y,
        size: 10,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(': ' + value, {
        x: marginX + 160,
        y,
        size: 10,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    };

    const formattedDate = formData.reRegisteredAt
      ? new Date(formData.reRegisteredAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }) + ' WIB'
      : '-';

    const infoFields = [
      { label: 'Nomor Pendaftaran', value: formData.registrationNumber || '-' },
      { label: 'Nama Lengkap', value: formData.namaSiswa },
      { label: 'NISN / NIK', value: `${formData.nisn} / ${formData.nik}` },
      { label: 'Jalur Pendaftaran', value: formData.jalur?.toUpperCase() + (isPJJ ? ` (${formData.pjjSchool || '-'})` : '') },
      { label: 'Asal Sekolah', value: formData.asalSekolah === 'SEKOLAH LAIN' ? (formData.asalSekolahManual || 'SEKOLAH LAIN') : formData.asalSekolah },
      { label: 'Waktu Daftar Ulang', value: formattedDate }
    ];

    infoFields.forEach((field) => {
      drawInfoField(field.label, field.value, currentY);
      currentY -= infoLineHeight;
    });

    // Table Section: Verification Checklist
    currentY -= 20;
    page.drawText('Tabel Kelengkapan Berkas (Diisi oleh Tim Verifikasi)', {
      x: marginX,
      y: currentY,
      size: 11,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    currentY -= 15;
    const tableHeaderY = currentY;
    const colWidths = [40, 250, 205]; // Total A4 width inside margins is 495

    // Draw Header Box
    page.drawRectangle({
      x: marginX,
      y: tableHeaderY - 20,
      width: colWidths[0] + colWidths[1] + colWidths[2],
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 1,
    });

    // Header Texts
    page.drawText('No', { x: marginX + 12, y: tableHeaderY - 14, size: 9, font: helveticaBold });
    page.drawText('Nama Dokumen / Berkas', { x: marginX + colWidths[0] + 10, y: tableHeaderY - 14, size: 9, font: helveticaBold });
    page.drawText('Status Kelengkapan', { x: marginX + colWidths[0] + colWidths[1] + 20, y: tableHeaderY - 14, size: 9, font: helveticaBold });

    // Table Rows
    const documents = [
      'Fotokopi Akta Kelahiran',
      'Fotokopi Kartu Keluarga (KK)',
      'Fotokopi Ijazah / Surat Keterangan Lulus (SKL)',
      'Dokumen Pendukung Alternatif / Sertifikat / Lampiran'
    ];

    let rowY = tableHeaderY - 20;
    const rowHeight = 25;

    documents.forEach((doc, idx) => {
      // Draw Row Box
      page.drawRectangle({
        x: marginX,
        y: rowY - rowHeight,
        width: colWidths[0] + colWidths[1] + colWidths[2],
        height: rowHeight,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 1,
      });

      // Draw vertical lines inside row
      page.drawLine({ start: { x: marginX + colWidths[0], y: rowY }, end: { x: marginX + colWidths[0], y: rowY - rowHeight }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
      page.drawLine({ start: { x: marginX + colWidths[0] + colWidths[1], y: rowY }, end: { x: marginX + colWidths[0] + colWidths[1], y: rowY - rowHeight }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });

      // Draw values
      page.drawText(String(idx + 1), { x: marginX + 16, y: rowY - 16, size: 9, font: helveticaFont });
      page.drawText(doc, { x: marginX + colWidths[0] + 10, y: rowY - 16, size: 9, font: helveticaFont });

      // Checkbox bracket placeholder
      page.drawText('[   ] Ada          [   ] Tidak Ada', { x: marginX + colWidths[0] + colWidths[1] + 20, y: rowY - 16, size: 9, font: helveticaFont });

      rowY -= rowHeight;
    });

    // Notes
    currentY = rowY - 20;
    page.drawText('Petunjuk / Keterangan:', {
      x: marginX,
      y: currentY,
      size: 9,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    const notes = [
      '1. Harap membawa Bukti Daftar Ulang ini beserta seluruh berkas fisik asli & fotokopi.',
      '2. Semua berkas dimasukkan ke dalam map sesuai petunjuk panitia.',
      '3. Tim Verifikasi akan memeriksa kelengkapan fisik berkas dan membubuhi tanda tangan.'
    ];

    notes.forEach((note) => {
      currentY -= 13;
      page.drawText(note, {
        x: marginX,
        y: currentY,
        size: 8,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    // Signatures
    currentY -= 50;
    const location = formData.school === 'mosa' ? 'Aceh Besar' : 'Banda Aceh';
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    page.drawText(`${location}, ${today}`, {
      x: width - marginX - 160,
      y: currentY,
      size: 9,
      font: helveticaFont,
    });

    currentY -= 15;

    // Left signature: Pendaftar
    page.drawText('Tanda Tangan Pendaftar,', { x: marginX, y: currentY, size: 9, font: helveticaFont });
    page.drawText('( ' + formData.namaSiswa + ' )', { x: marginX, y: currentY - 50, size: 9, font: helveticaBold });

    // Right signature: Tim Verifikasi
    page.drawText('Tim Verifikasi PPDB,', { x: width - marginX - 160, y: currentY, size: 9, font: helveticaFont });
    page.drawText('( ................................................. )', { x: width - marginX - 160, y: currentY - 50, size: 9, font: helveticaFont });

    const pdfBytes = await pdfDoc.save();
    const schoolAbbr = formData.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan';
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    saveAs(blob, `Bukti_Daftar_Ulang_${schoolAbbr}_${formData.namaSiswa}.pdf`);

  } catch (error) {
    onShowAlert('error', 'Gagal membuat bukti pendaftaran ulang');
  }
};

export const generateGraduationLetter = async (
  formData: any,
  onShowAlert: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void
) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Border
    const borderMargin = 25;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });

    const marginX = 60;
    const isPJJ = formData.jalur?.toLowerCase() === 'pjj';

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper to draw centered text
    const drawCenteredText = (text: string, y: number, size: number, font: any, color = rgb(0, 0, 0)) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        size,
        font,
        color,
      });
    };

    // Load logos
    const pancacitaResponse = await fetch('/images/pancacita.png');
    const pancacitaArrayBuffer = await pancacitaResponse.arrayBuffer();
    const pancacitaImage = await pdfDoc.embedPng(pancacitaArrayBuffer);

    const logoPath = isPJJ || formData.school === 'mosa' ? '/images/mosa.png' : '/images/fajar.png';
    const logoResponse = await fetch(logoPath);
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoArrayBuffer);

    // Header positioning
    const headerY = height - 60;

    // Scale logos dynamically to have exact matching heights (70px)
    const targetHeight = 70;
    const pancacitaDims = pancacitaImage.scale(targetHeight / pancacitaImage.height);
    const logoDims = logoImage.scale(targetHeight / logoImage.height);

    const logoCenterY = headerY - 20;

    // Draw Pancacita on the LEFT
    page.drawImage(pancacitaImage, {
      x: marginX,
      y: logoCenterY - (pancacitaDims.height / 2),
      width: pancacitaDims.width,
      height: pancacitaDims.height,
    });

    // Draw School Logo on the RIGHT
    page.drawImage(logoImage, {
      x: width - marginX - logoDims.width,
      y: logoCenterY - (logoDims.height / 2),
      width: logoDims.width,
      height: logoDims.height,
    });

    // Kop Surat Texts (Centered on page)
    drawCenteredText('PEMERINTAH PROVINSI ACEH', headerY, 11, helveticaBold, rgb(0.1, 0.1, 0.1));
    drawCenteredText('DINAS PENDIDIKAN', headerY - 13, 12, helveticaBold, rgb(0, 0, 0));

    const schoolName = isPJJ || formData.school === 'mosa' ? 'SMA NEGERI MODAL BANGSA' : 'SMA NEGERI 10 FAJAR HARAPAN';
    drawCenteredText(schoolName, headerY - 28, 14, helveticaBold, rgb(0, 0, 0));

    let addrStartY = headerY - 42;
    if (isPJJ) {
      drawCenteredText('PROGRAM PENDIDIKAN JARAK JAUH (PJJ)', headerY - 41, 9.5, helveticaBold, rgb(0, 0, 0));
      addrStartY = headerY - 53;
    }

    const addressLines = isPJJ || formData.school === 'mosa'
      ? [
        'Jalan Bandara Sultan Iskandar Muda Km.12,5, Aceh Besar 23360',
        'Telepon. (0651) 32517',
        'Laman: www.sman-modalbangsa.sch.id, Pos-el: info@sman-modalbangsa.sch.id'
      ]
      : [
        'Jalan Fajar Harapan No. 1, Ateuk Jawo, Kec. Baiturrahman, Kota Banda Aceh 23245',
        'Telepon. (0651) 7409840',
        'Laman: fajarharapan.sch.id, Pos-el: sman10@fajarharapan.sch.id'
      ];

    drawCenteredText(addressLines[0], addrStartY, 7.5, helveticaFont, rgb(0.3, 0.3, 0.3));
    drawCenteredText(addressLines[1], addrStartY - 10, 7.5, helveticaFont, rgb(0.3, 0.3, 0.3));
    drawCenteredText(addressLines[2], addrStartY - 20, 7.5, helveticaFont, rgb(0.3, 0.3, 0.3));

    // Double separation line (Kop line)
    const kopLineY = isPJJ ? headerY - 86 : headerY - 74;
    page.drawLine({
      start: { x: marginX, y: kopLineY },
      end: { x: width - marginX, y: kopLineY },
      thickness: 2,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawLine({
      start: { x: marginX, y: kopLineY - 3 },
      end: { x: width - marginX, y: kopLineY - 3 },
      thickness: 0.75,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Document Title
    const titleY = kopLineY - 30;
    const titleString = 'SURAT KETERANGAN LULUS SELEKSI';
    drawCenteredText(titleString, titleY, 13, helveticaBold, rgb(0, 0, 0));

    const { start, end } = getPPDBYear();
    const noSurat = `Nomor: PPDB/${start}/SKL/${formData.registrationNumber || '000'}`;
    drawCenteredText(noSurat, titleY - 14, 10, helveticaFont, rgb(0.2, 0.2, 0.2));

    // Opening Paragraph
    let textY = titleY - 42;
    const currentSchoolText = isPJJ || formData.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan';
    const openingText = `Kepala ${currentSchoolText} dengan ini menerangkan bahwa:`;
    const wrappedOpening = wrapText(openingText, 70);
    wrappedOpening.forEach(line => {
      page.drawText(line, {
        x: marginX,
        y: textY,
        size: 10.5,
        font: helveticaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      textY -= 15;
    });

    // Details Block (Table-like grid)
    textY -= 10;

    const wrapTextToWidth = (text: string, maxWidth: number, font: any, size: number): string[] => {
      if (!text) return ['-'];
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const width = font.widthOfTextAtSize(testLine, size);
        if (width <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const drawDetailRow = (label: string, val: string, y: number): number => {
      page.drawText(label, { x: marginX + 15, y, size: 10.5, font: helveticaBold });

      const wrappedLines = wrapTextToWidth(val, 320, helveticaFont, 10.5);
      const colonWidth = helveticaFont.widthOfTextAtSize(': ', 10.5);

      wrappedLines.forEach((line, idx) => {
        const lineY = y - (idx * 14);
        if (idx === 0) {
          page.drawText(': ' + line, { x: marginX + 130, y: lineY, size: 10.5, font: helveticaFont });
        } else {
          page.drawText(line, { x: marginX + 130 + colonWidth, y: lineY, size: 10.5, font: helveticaFont });
        }
      });

      return y - (wrappedLines.length * 14) - 6;
    };

    let jalurVal = '';
    if (isPJJ) {
      jalurVal = 'Pendidikan Jarak Jauh (PJJ)';
    } else {
      const jLower = formData.jalur?.toLowerCase();
      if (jLower === 'prestasi') jalurVal = 'Prestasi';
      else if (jLower === 'reguler') jalurVal = 'Reguler';
      else if (jLower === 'undangan') jalurVal = 'Undangan';
      else jalurVal = formData.jalur?.toUpperCase() || '-';
    }

    let pjjSchoolLabel = 'Sekolah Mitra';
    let pjjSchoolValue = '';
    if (isPJJ && formData.pjjSchool) {
      const isInduk = formData.pjjSchool.includes('(Induk)');
      pjjSchoolLabel = isInduk ? 'Sekolah Induk' : 'Sekolah Mitra';
      const parts = formData.pjjSchool.split(' - ');
      if (parts.length === 2) {
        const regency = parts[0].trim();
        const schoolName = parts[1].replace(/\((Mitra|Induk)\)/, '').trim();
        pjjSchoolValue = `${schoolName} (${regency})`;
      } else {
        pjjSchoolValue = formData.pjjSchool;
      }
    }

    const details = [
      { label: 'Nomor Registrasi', val: formData.registrationNumber || '-' },
      { label: 'Nama Lengkap', val: formData.namaSiswa },
      { label: 'NISN / NIK', val: `${formData.nisn || '-'} / ${formData.nik || '-'}` },
      { label: 'Jalur Seleksi', val: jalurVal },
      ...(isPJJ && pjjSchoolValue ? [{ label: pjjSchoolLabel, val: pjjSchoolValue }] : []),
      { label: 'Asal Sekolah', val: formData.asalSekolah === 'SEKOLAH LAIN' ? (formData.asalSekolahManual || 'SEKOLAH LAIN') : formData.asalSekolah }
    ];

    details.forEach(row => {
      textY = drawDetailRow(row.label, row.val, textY);
    });

    // Statement / Declaration
    textY -= 10;
    const statementText1 = 'Berdasarkan hasil evaluasi berkas dan seleksi akademik, yang bersangkutan dinyatakan:';
    page.drawText(statementText1, {
      x: marginX,
      y: textY,
      size: 10.5,
      font: helveticaFont,
    });

    const statement1Y = textY;
    const visualGap = 18; // Visually identical spacing between elements (18px)

    // Draw Box for "LULUS SELEKSI"
    const statusString = 'LULUS SELEKSI';
    const statusFontSize = 14;
    const boxPadding = 7;
    // pdf-lib draws text from the baseline; ascender height ≈ 72% of fontSize, descender ≈ 18%
    const textAscender = statusFontSize * 0.72;
    const textDescender = statusFontSize * 0.18;
    const boxHeight = textAscender + textDescender + (boxPadding * 2);
    const boxWidth = helveticaBold.widthOfTextAtSize(statusString, statusFontSize) + 60;

    // 1. Symmetrical distance from the bottom of statementText1 to the top of the box:
    // (statement1Y - text1Descender) - boxTopY = visualGap
    // => boxBottomY = statement1Y - text1Descender - visualGap - boxHeight
    const text1Descender = 10.5 * 0.18; // 1.89
    const boxBottomY = statement1Y - text1Descender - visualGap - boxHeight;

    // Vertically center the all-caps status text inside the box (using cap-height/ascender for all-caps symmetry)
    const textBaselineY = boxBottomY + (boxHeight - textAscender) / 2;

    page.drawRectangle({
      x: (width - boxWidth) / 2,
      y: boxBottomY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.9, 0.97, 0.92),
      borderColor: rgb(0.2, 0.7, 0.3),
      borderWidth: 1.5,
    });

    page.drawText(statusString, {
      x: (width - helveticaBold.widthOfTextAtSize(statusString, statusFontSize)) / 2,
      y: textBaselineY,
      size: statusFontSize,
      font: helveticaBold,
      color: rgb(0.08, 0.45, 0.2),
    });

    // 2. Symmetrical distance from the bottom of the box to the top of statementText2:
    // boxBottomY - (textY + text2Ascender) = visualGap => textY = boxBottomY - visualGap - text2Ascender
    const text2Ascender = 10.5 * 0.72; // 7.56
    textY = boxBottomY - visualGap - text2Ascender;
    const statementText2 = isPJJ
      ? `sebagai calon peserta didik baru Program Pendidikan Jarak Jauh (PJJ) SMAN Modal Bangsa Tahun Ajaran ${start}/${end}.`
      : `sebagai calon peserta didik baru ${currentSchoolText} Tahun Ajaran ${start}/${end}.`;
    
    // Wrap statementText2 dynamically to fit the width of the page
    const wrappedStatement = wrapTextToWidth(statementText2, width - (marginX * 2), helveticaFont, 10.5);
    wrappedStatement.forEach((line, idx) => {
      page.drawText(line, {
        x: marginX,
        y: textY - (idx * 14),
        size: 10.5,
        font: helveticaFont,
      });
    });

    // Baseline of the last line of statementText2
    const lastLineY = textY - (wrappedStatement.length - 1) * 14;

    // 3. Symmetrical distance from the bottom of statementText2 to the top of KETENTUAN DAFTAR ULANG:
    // (lastLineY - text2Descender) - (ketentuanY + ketentuanAscender) = visualGap
    // => ketentuanY = lastLineY - text2Descender - visualGap - ketentuanAscender
    const text2Descender = 10.5 * 0.18; // 1.89
    const ketentuanAscender = 10 * 0.72; // 7.20
    textY = lastLineY - text2Descender - visualGap - ketentuanAscender;
    page.drawText('KETENTUAN DAFTAR ULANG:', {
      x: marginX,
      y: textY,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const reRegNotes = [
      'Calon peserta didik yang dinyatakan lulus seleksi wajib melakukan konfirmasi daftar ulang secara online melalui sistem PPDB.',
      'Kelalaian dalam melakukan daftar ulang sesuai jadwal yang ditentukan dianggap sebagai pengunduran diri.',
    ];

    const noteIndentX = marginX + 18; // hanging indent for wrapped lines
    textY -= 14;
    reRegNotes.forEach((note, idx) => {
      // Draw the number prefix
      page.drawText(`${idx + 1}.`, { x: marginX + 5, y: textY, size: 9, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
      // Wrap and draw the note body with hanging indent
      const wrappedNote = wrapText(note, 72);
      wrappedNote.forEach(line => {
        page.drawText(line, {
          x: noteIndentX,
          y: textY,
          size: 9,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        textY -= 12;
      });
    });

    // Signature Block (Left-aligned, positioned at the right side)
    textY -= 25;
    const location = isPJJ || formData.school === 'mosa' ? 'Aceh Besar' : 'Banda Aceh';
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const principalName = isPJJ || formData.school === 'mosa' ? 'Misra, S.Pd., M.Pd.' : 'Dr. Anwar Amin, S.Pd., M.Ed.';
    const principalTitle = isPJJ || formData.school === 'mosa' ? 'Kepala SMAN Modal Bangsa,' : 'Kepala SMAN 10 Fajar Harapan,';
    const principalNip = isPJJ || formData.school === 'mosa'
      ? 'NIP. 19741231 200003 1 002'
      : 'NIP. 19700101 199801 1 001';

    const sigX = width - marginX - 200; // Left-aligned at fixed right-side position

    page.drawText(`${location}, ${today}`, { x: sigX, y: textY, size: 10, font: helveticaFont });
    textY -= 15;
    page.drawText(principalTitle, { x: sigX, y: textY, size: 10, font: helveticaBold });
    textY -= 55;
    page.drawText(principalName, { x: sigX, y: textY, size: 10, font: helveticaBold });
    textY -= 12;
    page.drawText(principalNip, { x: sigX, y: textY, size: 9, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });

    const pdfBytes = await pdfDoc.save();
    const schoolAbbr = formData.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan';
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    saveAs(blob, `Surat_Kelulusan_${schoolAbbr}_${formData.namaSiswa}.pdf`);

  } catch (error) {
    onShowAlert('error', 'Gagal membuat surat keterangan lulus seleksi');
  }
};
