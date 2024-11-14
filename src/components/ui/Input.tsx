import React, { InputHTMLAttributes } from 'react';
import classNames from 'classnames';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col">
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={classNames(
          'input border',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input; 