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
      return adminStatus === 'diterima' ? 'Lulus' : 'Ditolak';
    }

    switch (status) {
      case 'pending':
        return 'Draft';
      case 'submitted':
        return 'Pending';
      case 'draft':
        return 'Reset';
      default:
        return status;
    }
  };

  const getStatusColor = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' 
        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
        : 'text-rose-800 bg-rose-50 border-rose-200';
    }

    switch (status) {
      case 'pending':
        return 'text-zinc-600 bg-zinc-100 border-zinc-200';
      case 'submitted':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'draft':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      default:
        return 'text-zinc-600 bg-zinc-100 border-zinc-200';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-0.5 rounded-md text-[10px] font-extrabold border tracking-wide uppercase inline-flex items-center shadow-xs',
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
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'reguler':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'undangan':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'pjj':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return 'text-zinc-700 bg-zinc-100 border-zinc-200';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-0.5 rounded-md text-[10px] font-extrabold border tracking-wide uppercase inline-flex items-center shadow-xs',
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
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'fajar':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      default:
        return 'text-zinc-700 bg-zinc-100 border-zinc-200';
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
      'px-2 py-0.5 rounded-md text-[10px] font-extrabold border tracking-wide inline-flex items-center shadow-xs',
      getSchoolColor(school)
    )}>
      {getSchoolLabel(school)}
    </span>
  );
};
