import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  BuildingOfficeIcon, 
  SparklesIcon
} from '@heroicons/react/24/outline';

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
  const [selectedJalur, setSelectedJalur] = useState<'semua' | 'prestasi' | 'reguler' | 'undangan'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [pjjCount, setPjjCount] = useState(0);

  const loadStatsAndData = async () => {
    try {
      setLoading(true);
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
      
      // Pisahkan data reguler (Prestasi, Reguler, Undangan) dari data PJJ
      const regularData = submittedData.filter(item => item.jalur !== 'pjj');
      const pjjTotal = submittedData.filter(item => item.jalur === 'pjj').length;
      setPjjCount(pjjTotal);
      setData(regularData);

      const recentPendaftar = regularData
        .sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime())
        .slice(0, 6)
        .map(item => ({
          namaSiswa: item.namaSiswa,
          jalur: item.jalur,
          submittedAt: item.submittedAt || new Date().toISOString()
        }));

      setStats({
        totalPendaftar: regularData.length,
        pendaftarBaru: regularData.filter(item => 
          item.status === 'submitted' && !item.adminStatus
        ).length,
        pendaftarDiterima: regularData.filter(item => 
          item.adminStatus === 'diterima'
        ).length,
        pendaftarDitolak: regularData.filter(item => 
          item.adminStatus === 'ditolak'
        ).length,
        jalurPrestasi: regularData.filter(item => item.jalur === 'prestasi').length,
        jalurReguler: regularData.filter(item => item.jalur === 'reguler').length,
        jalurUndangan: regularData.filter(item => item.jalur === 'undangan').length,
        jalurPjj: 0,
        recentPendaftar
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndData();
  }, []);

  // Reset currentPage when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJalur]);

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
          <span className="text-xs font-semibold text-zinc-500">Memuat data dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans">
      {/* ================= HERO COMMAND BAR ================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c241b] via-[#091a13] to-[#06120d] text-white border border-emerald-500/20 shadow-2xl overflow-hidden">
        {/* Ambient Glows inside Hero */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.18em] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>PORTAL REGULER & UTAMA</span>
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                SMAN Modal Bangsa & SMAN 10 Fajar Harapan
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Dashboard SPMB Reguler (Prestasi, Reguler, Undangan)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300/80 leading-relaxed">
              Monitoring pendaftaran, verifikasi berkas, dan evaluasi hasil nilai rapor secara komprehensif dan akurat.
            </p>
          </div>

          {/* Quick Segmented Portal Switcher */}
          <div className="p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-2 shrink-0 self-start lg:self-center shadow-lg">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md">
              <AcademicCapIcon className="w-4 h-4" />
              <span>SPMB Reguler</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 ml-1">
                {stats.totalPendaftar}
              </span>
            </div>

            <Link
              to="/admin/dashboard-pjj"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 font-semibold text-xs transition-all"
            >
              <BuildingOfficeIcon className="w-4 h-4 text-amber-400" />
              <span>SPMB PJJ</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">
                {pjjCount}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Main Stat Cards (Double Bezel) */}
      <StatCards stats={stats} />

      {/* 2. Track Distribution & Recent Applicants Bento */}
      <SecondaryStats stats={stats} />

      {/* 3. Average Score Metrics */}
      <AverageScores data={data} />

      {/* 4. Subject In-Depth Averages by Track */}
      <SubjectAveragesByJalur data={data} />

      {/* 5. Top Scoring Students Ranking Table */}
      <TopStudentsTable
        data={data}
        selectedJalur={selectedJalur as any}
        setSelectedJalur={setSelectedJalur as any}
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