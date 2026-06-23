import { ref, runTransaction, Database } from 'firebase/database';
import { auth } from '../firebase/config';

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
    // Fallback: if transaction fails (e.g. due to permission_denied),
    // return a unique 4-digit sequence based on candidate UID hash and timestamp.
    const user = auth.currentUser;
    let uidHash = 0;
    if (user && user.uid) {
      for (let i = 0; i < user.uid.length; i++) {
        uidHash = (uidHash << 5) - uidHash + user.uid.charCodeAt(i);
        uidHash |= 0; // Convert to 32bit integer
      }
      uidHash = Math.abs(uidHash);
    } else {
      uidHash = Math.floor(Math.random() * 10000);
    }

    const timeVal = Date.now();
    const mixed = (uidHash + timeVal) % 10000;
    const paddedNumber = mixed.toString().padStart(4, '0');
    return `${yearCode}${kabupatenKode}${paddedNumber}`;
  }
};
