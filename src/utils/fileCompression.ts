import imageCompression from 'browser-image-compression';

type CompressionOptions = {
  maxWidthOrHeight?: number;
  initialQuality?: number;
  maxIteration?: number;
  maxSizeMB?: number;
};

export const compressFile = async (
  file: File, 
  targetSizeKB: number = 300,
  options?: CompressionOptions
): Promise<File> => {
  const maxFileSize = 4 * 1024 * 1024; // 4MB dalam bytes

  // Validasi ukuran file awal
  if (file.size > maxFileSize) {
    throw new Error('Ukuran file maksimal 4MB');
  }

  // Untuk file PDF, hanya validasi ukuran
  if (file.type === 'application/pdf') {
    if (file.size > 500 * 1024) { // 500KB
      throw new Error('Ukuran file PDF tidak boleh lebih dari 500KB');
    }
    return file;
  }

  // Untuk file gambar
  if (file.type.startsWith('image/')) {
    try {
      const compressionOptions = {
        maxSizeMB: options?.maxSizeMB || targetSizeKB / 1024,
        maxWidthOrHeight: options?.maxWidthOrHeight || 800,
        initialQuality: options?.initialQuality || 0.5,
        maxIteration: options?.maxIteration || 10,
        useWebWorker: true,
        alwaysKeepResolution: false,
        fileType: 'image/jpeg',
      };

      let compressedFile = await imageCompression(file, compressionOptions);

      if (compressedFile.size > targetSizeKB * 1024) {
        compressionOptions.maxWidthOrHeight = 600;
        compressionOptions.initialQuality = 0.3;
        compressedFile = await imageCompression(compressedFile, compressionOptions);
      }

      console.log('Image Kompresi berhasil:', {
        originalSize: `${(file.size / 1024).toFixed(2)}KB`,
        targetSize: `${targetSizeKB}KB`,
        compressedSize: `${(compressedFile.size / 1024).toFixed(2)}KB`,
      });

      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Gagal mengkompresi gambar. Silakan coba lagi.');
    }
  }

  throw new Error('Format file tidak didukung');
}; 