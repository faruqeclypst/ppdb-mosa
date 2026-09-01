import React from 'react';
import { 
  TrophyIcon, 
  ChevronDownIcon, 
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Pagination from '../../ui/Pagination';
import { PPDBData, StudentWithAverage, SortConfig } from '../../../types/ppdb';

interface TopStudentsTableProps {
  data: PPDBData[];
  selectedJalur: 'semua' | 'prestasi' | 'reguler' | 'undangan' | 'pjj';
  setSelectedJalur: (jalur: 'semua' | 'prestasi' | 'reguler' | 'undangan' | 'pjj') => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  expandedStudent?: string | null;
  setExpandedStudent?: (uid: string | null) => void;
}

const itemsPerPage = 10;

const calculateStudentAverage = (student: PPDBData) => {
  const subjects = ['nilaiAgama', 'nilaiBindo', 'nilaiBing', 'nilaiMtk', 'nilaiIpa'];
  const semesters = ['2', '3', '4'];
  let totalNilai = 0;
  let totalFields = 0;

  subjects.forEach(subject => {
    semesters.forEach(semester => {
      const nilai = parseFloat(student[`${subject}${semester}` as keyof PPDBData] as string);
      if (!isNaN(nilai)) {
        totalNilai += nilai;
        totalFields++;
      }
    });
  });

  return totalFields > 0 ? totalNilai / totalFields : 0;
};

const TopStudentsTable: React.FC<TopStudentsTableProps> = ({
  data,
  selectedJalur,
  setSelectedJalur,
  sortConfig,
  setSortConfig,
  currentPage,
  setCurrentPage,
}) => {

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getTopStudents = (): StudentWithAverage[] => {
    let sortedData = data
      .map(student => ({
        ...student,
        average: calculateStudentAverage(student)
      }))
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur);

    if (!sortConfig) {
      sortedData = sortedData.sort((a, b) => b.average - a.average);
    } else {
      sortedData = sortedData.sort((a, b) => {
        if (sortConfig.key === 'namaSiswa') {
          return sortConfig.direction === 'asc' 
            ? a.namaSiswa.localeCompare(b.namaSiswa)
            : b.namaSiswa.localeCompare(a.namaSiswa);
        }
        if (sortConfig.key === 'jalur') {
          return sortConfig.direction === 'asc'
            ? a.jalur.localeCompare(b.jalur)
            : b.jalur.localeCompare(a.jalur);
        }
        if (sortConfig.key === 'asalSekolah') {
          return sortConfig.direction === 'asc'
            ? a.asalSekolah.localeCompare(b.asalSekolah)
            : b.asalSekolah.localeCompare(a.asalSekolah);
        }
        if (sortConfig.key === 'average') {
          return sortConfig.direction === 'asc'
            ? a.average - b.average
            : b.average - a.average;
        }
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sortedData.slice(startIndex, endIndex);
  };

  const totalFilteredData = data.filter(student => 
    selectedJalur === 'semua' ? true : student.jalur === selectedJalur
  ).length;

  const totalPages = Math.ceil(totalFilteredData / itemsPerPage);

  const filterButtons = [
    { id: 'semua', label: 'Semua Jalur' },
    { id: 'prestasi', label: 'Prestasi' },
    { id: 'reguler', label: 'Reguler' },
    { id: 'undangan', label: 'Undangan' }
  ];

  return (
    <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden">
      <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-5">
        {/* Table Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center font-bold shadow-xs">
              <TrophyIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
                Peringkat Nilai Rapor Tertinggi (Top Students)
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Akumulasi rata-rata nilai semester 2, 3, dan 4 lima mata pelajaran
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/60">
              {filterButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedJalur(btn.id as any)}
                  className={classNames(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    selectedJalur === btn.id
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                      : 'text-zinc-600 hover:text-zinc-900'
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {sortConfig && (
              <button
                onClick={() => setSortConfig(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                <span>Reset Urutan</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Area */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                <th className="px-4 py-3 text-center w-12">Rank</th>
                <th 
                  className="px-4 py-3 cursor-pointer hover:text-emerald-700 transition-colors"
                  onClick={() => handleSort('namaSiswa')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Calon Siswa</span>
                    {sortConfig?.key === 'namaSiswa' && <ChevronDownIcon className="w-3.5 h-3.5" />}
                  </div>
                </th>
                <th className="px-4 py-3">Jalur</th>
                <th className="px-4 py-3">Asal Sekolah</th>
                <th className="px-3 py-3 text-center">Agama</th>
                <th className="px-3 py-3 text-center">B.Indo</th>
                <th className="px-3 py-3 text-center">B.Ing</th>
                <th className="px-3 py-3 text-center">MTK</th>
                <th className="px-3 py-3 text-center">IPA</th>
                <th 
                  className="px-4 py-3 text-center cursor-pointer hover:text-emerald-700 transition-colors"
                  onClick={() => handleSort('average')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Rata-Rata</span>
                    {sortConfig?.key === 'average' && <ChevronDownIcon className="w-3.5 h-3.5" />}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Sekolah Pilihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {getTopStudents().map((student, index) => {
                const rankNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
                
                const getSubjectAverage = (subject: string) => {
                  const fieldName = subject === 'B.Indo' ? 'nilaiBindo' :
                                    subject === 'B.Ing' ? 'nilaiBing' :
                                    subject === 'MTK' ? 'nilaiMtk' :
                                    subject === 'IPA' ? 'nilaiIpa' : 'nilaiAgama';
                    
                  const sem2 = parseFloat(student[`${fieldName}2` as keyof PPDBData] as string) || 0;
                  const sem3 = parseFloat(student[`${fieldName}3` as keyof PPDBData] as string) || 0;
                  const sem4 = parseFloat(student[`${fieldName}4` as keyof PPDBData] as string) || 0;
                  return ((sem2 + sem3 + sem4) / 3).toFixed(1);
                };

                const jalurClass = 
                  student.jalur === 'prestasi' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  student.jalur === 'reguler' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  'bg-purple-50 text-purple-800 border-purple-200';

                return (
                  <tr key={student.uid} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-4 py-3.5 text-center font-black">
                      {rankNumber === 1 ? (
                        <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs inline-flex items-center justify-center shadow-xs">
                          🥇
                        </span>
                      ) : rankNumber === 2 ? (
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-xs inline-flex items-center justify-center shadow-xs">
                          🥈
                        </span>
                      ) : rankNumber === 3 ? (
                        <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs inline-flex items-center justify-center shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-mono font-bold text-xs">
                          #{rankNumber}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-zinc-900">{student.namaSiswa}</div>
                      <div className="text-[10px] text-zinc-400 font-medium">{student.nisn ? `NISN: ${student.nisn}` : '-'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-xs ${jalurClass}`}>
                        {student.jalur ? student.jalur.toUpperCase() : '-'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-zinc-600 font-medium max-w-[180px] truncate">
                      {student.asalSekolah || '-'}
                    </td>

                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{getSubjectAverage('Agama')}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{getSubjectAverage('B.Indo')}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{getSubjectAverage('B.Ing')}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{getSubjectAverage('MTK')}</td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{getSubjectAverage('IPA')}</td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px] shadow-xs">
                        {student.average.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="text-[11px] font-bold text-zinc-600">
                        {student.school === 'fajar' ? 'SMAN 10 Fajar Harapan' : 'SMAN Modal Bangsa'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden space-y-3">
          {getTopStudents().map((student, index) => {
            const rankNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
            return (
              <div key={student.uid} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-zinc-200 text-zinc-800 font-black text-xs flex items-center justify-center">
                      #{rankNumber}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900">{student.namaSiswa}</h4>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {student.average.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Jalur: <strong>{student.jalur?.toUpperCase()}</strong></span>
                  <span>{student.school === 'fajar' ? 'Fajar Harapan' : 'Modal Bangsa'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
            <span className="text-xs text-zinc-500 font-medium">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalFilteredData)} dari {totalFilteredData} siswa
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalFilteredData}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TopStudentsTable;
