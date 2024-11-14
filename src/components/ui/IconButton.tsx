import React, { ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
};

const IconButton: React.FC<IconButtonProps> = ({ icon, label, className, ...props }) => {
  return (
    <button
      className={classNames('flex items-center justify-center p-2 rounded hover:bg-gray-200 focus:outline-none', className)}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
};

export default IconButton; 