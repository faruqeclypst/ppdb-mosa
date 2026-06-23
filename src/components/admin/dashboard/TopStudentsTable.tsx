import React from 'react';
import Card from '../../ui/Card';
import { AcademicCapIcon, FunnelIcon, ChevronDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Pagination from '../../ui/Pagination';
import { PPDBData, StudentWithAverage, SortConfig } from '../../../types/ppdb';
import { StatusBadge, getJalurLabel } from '../AdminBadges';

interface TopStudentsTableProps {
  data: PPDBData[];
  selectedJalur: 'semua' | 'prestasi' | 'reguler' | 'undangan' | 'pjj';
  setSelectedJalur: (jalur: 'semua' | 'prestasi' | 'reguler' | 'undangan' | 'pjj') => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  expandedStudent: string | null;
  setExpandedStudent: (uid: string | null) => void;
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
  expandedStudent,
  setExpandedStudent,
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

  const getTotalPages = () => {
    const filteredTotal = data
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur)
      .length;
    return Math.ceil(filteredTotal / itemsPerPage);
  };

  const getFilteredTotal = () => {
    return data
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur)
      .length;
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Nilai Rata-rata Tertinggi</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Jalur */}
          <div className="relative">
            <select
              value={selectedJalur}
              onChange={(e) => setSelectedJalur(e.target.value as typeof selectedJalur)}
              className="appearance-none pl-8 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors"
            >
              <option value="semua">Semua Jalur</option>
              <option value="prestasi">Jalur Prestasi</option>
              <option value="reguler">Jalur Reguler</option>
              <option value="undangan">Jalur Undangan</option>
              <option value="pjj">Jalur PJJ</option>
            </select>
            <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Reset Sort Button */}
          {sortConfig && (
            <button
              onClick={() => setSortConfig(null)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500"
            >
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1.5" />
              Reset Urutan
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('namaSiswa')}
              >
                <div className="flex items-center gap-1">
                  Nama
                  {sortConfig?.key === 'namaSiswa' && (
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th
                className={classNames(
                  "px-4 py-3 text-left text-xs font-medium text-gray-500",
                  selectedJalur === 'semua'
                    ? "cursor-pointer hover:text-blue-600"
                    : "opacity-50"
                )}
                onClick={() => selectedJalur === 'semua' && handleSort('jalur')}
              >
                <div className="flex items-center gap-1">
                  Jalur
                  {selectedJalur === 'semua' && sortConfig?.key === 'jalur' && (
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('asalSekolah')}
              >
                <div className="flex items-center gap-1">
                  Asal Sekolah
                  {sortConfig?.key === 'asalSekolah' && (
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Agama</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">B.Indo</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">B.Ing</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">MTK</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">IPA</th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('average')}
              >
                <div className="flex items-center justify-center gap-1">
                  Rata-rata
                  {sortConfig?.key === 'average' && (
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform ${
                        sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sekolah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getTopStudents().map((student, index) => {
              const getSubjectAverage = (subject: string) => {
                const fieldName = subject === 'B.Indo' ? 'nilaiBindo' :
                                  subject === 'B.Ing' ? 'nilaiBing' :
                                  subject === 'MTK' ? 'nilaiMtk' :
                                  subject === 'IPA' ? 'nilaiIpa' : 'nilaiAgama';
                  
                const sem2 = parseFloat(student[`${fieldName}2` as keyof PPDBData] as string) || 0;
                const sem3 = parseFloat(student[`${fieldName}3` as keyof PPDBData] as string) || 0;
                const sem4 = parseFloat(student[`${fieldName}4` as keyof PPDBData] as string) || 0;
                return ((sem2 + sem3 + sem4) / 3).toFixed(2);
              };

              return (
                <tr key={student.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {student.namaSiswa}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={classNames(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      student.jalur === 'prestasi' ? 'bg-blue-100 text-blue-800' :
                      student.jalur === 'reguler' ? 'bg-green-100 text-green-800' :
                      student.jalur === 'undangan' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    )}>
                      {getJalurLabel(student.jalur)}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="text-sm text-gray-500 truncate">
                      {student.asalSekolah === 'SEKOLAH LAIN' ? (student.asalSekolahManual ? `${student.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : student.asalSekolah}
                    </div>
                  </td>
                  {['nilaiAgama', 'nilaiBindo', 'nilaiBing', 'nilaiMtk', 'nilaiIpa'].map((subject) => (
                    <td key={subject} className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={classNames(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          parseFloat(getSubjectAverage(subject)) >= 85
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}>
                          {getSubjectAverage(subject)}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.average.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <StatusBadge 
                        status={student.status}
                        adminStatus={student.adminStatus}
                        className="text-xs"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={classNames(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      student.school === 'mosa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    )}>
                      {student.school === 'mosa' ? 'MOSA' : 'FAJAR'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Accordion List View */}
      <div className="md:hidden">
        <div className="space-y-3">
          {getTopStudents().map((student, index) => {
            const getSubjectAverage = (subject: string) => {
              const fieldName = subject === 'B.Indo' ? 'nilaiBindo' :
                               subject === 'B.Ing' ? 'nilaiBing' :
                               subject === 'MTK' ? 'nilaiMtk' :
                               subject === 'IPA' ? 'nilaiIpa' : 'nilaiAgama';
                  
              const sem2 = parseFloat(student[`${fieldName}2` as keyof PPDBData] as string) || 0;
              const sem3 = parseFloat(student[`${fieldName}3` as keyof PPDBData] as string) || 0;
              const sem4 = parseFloat(student[`${fieldName}4` as keyof PPDBData] as string) || 0;
              return ((sem2 + sem3 + sem4) / 3).toFixed(2);
            };

            return (
              <div key={student.uid} className="bg-white border rounded-lg shadow-sm">
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedStudent(expandedStudent === student.uid ? null : student.uid)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {student.namaSiswa}
                      </h3>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {student.asalSekolah === 'SEKOLAH LAIN' ? (student.asalSekolahManual ? `${student.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : student.asalSekolah}
                        </span>
                        <span className={classNames(
                          "text-xs font-medium",
                          student.jalur === 'prestasi' ? 'text-blue-600' :
                          student.jalur === 'reguler' ? 'text-green-600' :
                          student.jalur === 'undangan' ? 'text-purple-600' :
                          'text-amber-600'
                        )}>
                          {getJalurLabel(student.jalur)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium self-center">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </div>
                  </div>
                </div>

                {expandedStudent === student.uid && (
                  <div className="border-t">
                    <div className="p-3 space-y-2">
                      {['Agama', 'B.Indo', 'B.Ing', 'MTK', 'IPA'].map((subject, idx) => {
                        const nilai = getSubjectAverage(subject);
                        return (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                              <span className="text-sm text-gray-700">{subject}</span>
                            </div>
                            <span className={classNames(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              parseFloat(nilai) >= 85
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}>
                              {nilai}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
                      <span className="text-sm text-gray-700">Status</span>
                      <StatusBadge 
                        status={student.status}
                        adminStatus={student.adminStatus}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={getTotalPages()}
            onPageChange={setCurrentPage}
            totalItems={getFilteredTotal()}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </Card>
  );
};

export default TopStudentsTable;
