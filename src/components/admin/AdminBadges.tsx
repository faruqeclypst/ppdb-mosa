import React from 'react';
import classNames from 'classnames';
import { PPDBData, BadgeProps } from '../../types/ppdb';

export const getJalurLabel = (jalur: PPDBData['jalur']) => {
  const labels = {
    prestasi: 'Prestasi',
    reguler: 'Reguler', 
    undangan: 'Undangan',
    pjj: 'PJJ'
  };
  return labels[jalur] || jalur;
};

export const StatusBadge: React.FC<BadgeProps> = ({ status, adminStatus, className }) => {
  const getStatusLabel = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' ? 'Diterima' : 'Ditolak';
    }

    switch (status) {
      case 'pending':
        return 'Draft';
      case 'submitted':
        return 'Pending';
      case 'draft':
        return 'Reset'; // Ubah label draft menjadi reset
      default:
        return status;
    }
  };

  const getStatusColor = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' 
        ? 'text-green-600 bg-green-50'
        : 'text-red-600 bg-red-50';
    }

    switch (status) {
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'submitted':
        return 'text-yellow-600 bg-yellow-50';
      case 'draft':
        return 'text-purple-600 bg-purple-50'; // Ubah warna untuk status reset
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-sm font-medium',
      getStatusColor(status, adminStatus),
      className
    )}>
      {getStatusLabel(status, adminStatus)}
    </span>
  );
};

export const JalurBadge: React.FC<{ jalur: PPDBData['jalur'] }> = ({ jalur }) => {
  const getJalurColor = (jalur: PPDBData['jalur']) => {
    switch (jalur) {
      case 'prestasi':
        return 'text-blue-600 bg-blue-50';
      case 'reguler':
        return 'text-green-600 bg-green-50';
      case 'undangan':
        return 'text-purple-600 bg-purple-50';
      case 'pjj':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-sm font-medium',
      getJalurColor(jalur)
    )}>
      {getJalurLabel(jalur)}
    </span>
  );
};

export const SchoolBadge: React.FC<{ school: PPDBData['school'] }> = ({ school }) => {
  const getSchoolColor = (school: PPDBData['school']) => {
    switch (school) {
      case 'mosa':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fajar':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSchoolLabel = (school: PPDBData['school']) => {
    switch (school) {
      case 'mosa':
        return 'SMAN Modal Bangsa';
      case 'fajar':
        return 'SMAN 10 Fajar Harapan';
      default:
        return school;
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-xs font-medium border',
      getSchoolColor(school)
    )}>
      {getSchoolLabel(school)}
    </span>
  );
};
