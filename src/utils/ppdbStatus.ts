import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import type { PPDBSettings } from '../types/settings';

export const getPPDBStatus = async (): Promise<boolean> => {
  try {
    const settingsRef = ref(db, 'settings/ppdb');
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      const settings: PPDBSettings = snapshot.val();
      return settings.isActive;
    }
    return false;
  } catch (error) {
    console.error('Error checking PPDB status:', error);
    return false;
  }
}; 