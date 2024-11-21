import React, { InputHTMLAttributes } from 'react';
import classNames from 'classnames';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  mobilelabel?: React.ReactNode;
};

const Input: React.FC<InputProps> = ({ label, mobilelabel, className, ...props }) => {
  return (
    <div className="flex flex-col">
      {(label || mobilelabel) && (
        <label className="mb-1 text-sm font-medium text-gray-700">
          {mobilelabel || label}
        </label>
      )}
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