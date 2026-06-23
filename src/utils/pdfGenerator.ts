import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { getPPDBYear } from './registrationNumber';

export interface PDFFormData {
  school: 'mosa' | 'fajar';
  jalur: string;
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
      y: headerY - logoDims.height/2 - 5,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Header text
    const headerTextX = marginX + logoDims.width + 30;
    
    page.drawText('PENERIMAAN PESERTA DIDIK BARU', {
      x: headerTextX,
      y: headerY + 15,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const schoolName = formData.school === 'mosa' ? 'SMAN MODAL BANGSA' : 'SMAN 10 FAJAR HARAPAN';
    page.drawText(schoolName, {
      x: headerTextX,
      y: headerY - 10,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const { start, end } = getPPDBYear();
    page.drawText(`TAHUN PELAJARAN ${start}/${end}`, {
      x: headerTextX,
      y: headerY - 35,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Separation line
    const lineY = headerY - 60;
    page.drawLine({
      start: { x: marginX, y: lineY },
      end: { x: width - marginX, y: lineY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Title
    page.drawText('BUKTI PENDAFTARAN', {
      x: (width - helveticaBold.widthOfTextAtSize('BUKTI PENDAFTARAN', 14)) / 2,
      y: lineY - 35,
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

    const textColor = rgb(0.5, 0.5, 0.5);
    page.drawText('Tempel', {
      x: photoX + photoWidth/2 - 12,
      y: photoY + photoHeight/2 + 10,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });

    page.drawText('Pas Foto 3x4', {
      x: photoX + photoWidth/2 - 20,
      y: photoY + photoHeight/2 - 5,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });

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
    page.drawText(`Kartu ini sebagai bukti pendaftaran PPDB ${formData.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`, {
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
