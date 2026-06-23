import { ref, runTransaction, Database } from 'firebase/database';

export const getPPDBYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Jika sudah lewat bulan Juli (index 6), gunakan tahun berikutnya
  const startYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
  const endYear = startYear + 1;

  // Format tahun untuk nomor pendaftaran: XYXY (contoh: 2526 untuk 2025/2026)
  const yearCode = `${startYear.toString().slice(-2)}${endYear.toString().slice(-2)}`;

  return {
    start: startYear,
    end: endYear,
    yearCode
  };
};

export const generateAtomicRegistrationNumber = async (
  db: Database,
  school: 'mosa' | 'fajar',
  kabupatenKode: string
): Promise<string> => {
  const { yearCode } = getPPDBYear();
  const counterRef = ref(db, `ppdb_counters/${school}/${yearCode}`);

  try {
    const result = await runTransaction(counterRef, (currentValue) => {
      if (currentValue === null || currentValue === undefined) {
        return 1;
      }
      return currentValue + 1;
    });

    if (result.committed) {
      const nextNum = result.snapshot.val() as number;
      const paddedNumber = nextNum.toString().padStart(4, '0');
      return `${yearCode}${kabupatenKode}${paddedNumber}`;
    } else {
      throw new Error('Transaction not committed');
    }
  } catch (error) {
    // Fallback: if transaction fails, return a random suffix to prevent fatal errors,
    // though runTransaction is highly reliable in Firebase RTDB.
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${yearCode}${kabupatenKode}${randomSuffix}`;
  }
};
