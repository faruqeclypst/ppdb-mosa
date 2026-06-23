import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';

// Shared types and utilities
import { PPDBData, DashboardStats, SortConfig } from '../../types/ppdb';
import StatCards from './dashboard/StatCards';
import SecondaryStats from './dashboard/SecondaryStats';
import AverageScores from './dashboard/AverageScores';
import SubjectAveragesByJalur from './dashboard/SubjectAveragesByJalur';
import TopStudentsTable from './dashboard/TopStudentsTable';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPendaftar: 0,
    pendaftarBaru: 0,
    pendaftarDiterima: 0,
    pendaftarDitolak: 0,
    jalurPrestasi: 0,
    jalurReguler: 0,
    jalurUndangan: 0,
    jalurPjj: 0,
    recentPendaftar: []
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PPDBData[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [selectedJalur, setSelectedJalur] = useState<'semua' | 'prestasi' | 'reguler' | 'undangan' | 'pjj'>('semua');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const mosaRef = ref(db, 'ppdb_mosa');
        const fajarRef = ref(db, 'ppdb_fajar');
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);
        
        let allData: PPDBData[] = [];
        
        if (mosaSnapshot.exists()) {
          const mosaData = Object.values(mosaSnapshot.val()) as PPDBData[];
          allData = [...allData, ...mosaData];
        }
        
        if (fajarSnapshot.exists()) {
          const fajarData = Object.values(fajarSnapshot.val()) as PPDBData[];
          allData = [...allData, ...fajarData];
        }

        const submittedData = allData.filter(item => item.submittedAt);
        
        const recentPendaftar = submittedData
          .sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime())
          .slice(0, 6)
          .map(item => ({
            namaSiswa: item.namaSiswa,
            jalur: item.jalur,
            submittedAt: item.submittedAt || new Date().toISOString()
          }));

        setStats({
          totalPendaftar: submittedData.length,
          pendaftarBaru: submittedData.filter(item => 
            item.status === 'submitted' && !item.adminStatus
          ).length,
          pendaftarDiterima: submittedData.filter(item => 
            item.adminStatus === 'diterima'
          ).length,
          pendaftarDitolak: submittedData.filter(item => 
            item.adminStatus === 'ditolak'
          ).length,
          jalurPrestasi: submittedData.filter(item => item.jalur === 'prestasi').length,
          jalurReguler: submittedData.filter(item => item.jalur === 'reguler').length,
          jalurUndangan: submittedData.filter(item => item.jalur === 'undangan').length,
          jalurPjj: submittedData.filter(item => item.jalur === 'pjj').length,
          recentPendaftar
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const mosaRef = ref(db, 'ppdb_mosa');
        const fajarRef = ref(db, 'ppdb_fajar');
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);
        
        let allData: PPDBData[] = [];
        
        if (mosaSnapshot.exists()) {
          const mosaData = Object.entries(mosaSnapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as Omit<PPDBData, 'uid'>),
            school: 'mosa' as const
          }));
          allData = [...allData, ...mosaData];
        }
        
        if (fajarSnapshot.exists()) {
          const fajarData = Object.entries(fajarSnapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as Omit<PPDBData, 'uid'>),
            school: 'fajar' as const
          }));
          allData = [...allData, ...fajarData];
        }

        const submittedData = allData.filter(item => item.submittedAt);
        setData(submittedData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Reset currentPage when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJalur]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 1. Main Summary Stats */}
      <StatCards stats={stats} />

      {/* 2. Distributions & Recent registrations */}
      <SecondaryStats stats={stats} />

      {/* 3. Average subject & pathway values */}
      <AverageScores data={data} />

      {/* 4. Pathway in-depth detail averages */}
      <SubjectAveragesByJalur data={data} />

      {/* 5. Highest scoring top students table */}
      <TopStudentsTable
        data={data}
        selectedJalur={selectedJalur}
        setSelectedJalur={setSelectedJalur}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        expandedStudent={expandedStudent}
        setExpandedStudent={setExpandedStudent}
      />
    </div>
  );
};

export default DashboardPage;