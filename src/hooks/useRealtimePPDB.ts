import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import { PPDBData } from '../types/ppdb';

export const useRealtimePPDB = (userRole: any) => {
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));

  useEffect(() => {
    if (!userRole) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (userRole.isMaster) {
      const mosaRef = ref(db, 'ppdb_mosa');
      const fajarRef = ref(db, 'ppdb_fajar');

      let mosaData: PPDBData[] = [];
      let fajarData: PPDBData[] = [];

      const updateCombined = () => {
        setPendaftar([...mosaData, ...fajarData]);
        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
        setLoading(false);
      };

      const unsubscribeMosa = onValue(mosaRef, (snapshot) => {
        mosaData = snapshot.exists()
          ? Object.entries(snapshot.val()).map(([uid, value]) => ({
              uid,
              school: 'mosa' as const,
              ...(value as Omit<PPDBData, 'uid' | 'school'>)
            }))
          : [];
        updateCombined();
      }, (error) => {
        console.error('Error listening to mosa PPDB:', error);
        setLoading(false);
      });

      const unsubscribeFajar = onValue(fajarRef, (snapshot) => {
        fajarData = snapshot.exists()
          ? Object.entries(snapshot.val()).map(([uid, value]) => ({
              uid,
              school: 'fajar' as const,
              ...(value as Omit<PPDBData, 'uid' | 'school'>)
            }))
          : [];
        updateCombined();
      }, (error) => {
        console.error('Error listening to fajar PPDB:', error);
        setLoading(false);
      });

      return () => {
        unsubscribeMosa();
        unsubscribeFajar();
      };
    } else {
      const ppdbRef = ref(db, `ppdb_${userRole.school}`);

      const unsubscribe = onValue(ppdbRef, (snapshot) => {
        if (snapshot.exists()) {
          const data: PPDBData[] = Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            school: userRole.school as 'mosa' | 'fajar',
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          }));
          setPendaftar(data);
        } else {
          setPendaftar([]);
        }
        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
        setLoading(false);
      }, (error) => {
        console.error(`Error listening to ${userRole.school} PPDB:`, error);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userRole]);

  return { pendaftar, setPendaftar, loading, lastUpdatedTime };
};
