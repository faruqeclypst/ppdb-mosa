import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import classNames from 'classnames';

type AlertType = 'success' | 'error' | 'warning' | 'info';

type AlertProps = {
  type?: AlertType;
  message: string;
  className?: string;
};

const Alert: React.FC<AlertProps> = ({ type = 'info', message, className }) => {
  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div className={classNames('border px-4 py-3 rounded relative', typeStyles[type], className)} role="alert">
      <span className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
        <span>{message}</span>
      </span>
    </div>
  );
};

export default Alert; 