import React, { useState, useEffect } from 'react';
import InfoPPDBSection from '../components/landingpage/InfoPPDBSection';
import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import type { PPDBSettings } from '../types/settings';

const InfoPPDBPage: React.FC = () => {
  const [ppdbSettings, setPPDBSettings] = useState<PPDBSettings | null>(null);

  useEffect(() => {
    const loadPPDBSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/ppdb');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          setPPDBSettings(snapshot.val());
        }
      } catch (error) {
        console.error('Error loading PPDB settings:', error);
      }
    };

    loadPPDBSettings();
  }, []);

  return (
    <div className="pt-16">
      <InfoPPDBSection settings={ppdbSettings} />
    </div>
  );
};

export default InfoPPDBPage; 