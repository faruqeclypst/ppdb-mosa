import React from 'react';
import classNames from 'classnames';

type BadgeProps = {
  status: 'pending' | 'diterima' | 'ditolak';
  className?: string;
};

const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    diterima: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  };

  return (
    <span className={classNames('px-2 py-1 rounded-full text-sm font-medium', statusStyles[status], className)}>
      {status}
    </span>
  );
};

export default Badge; 