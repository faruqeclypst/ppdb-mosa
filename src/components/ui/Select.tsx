import React, { SelectHTMLAttributes } from 'react';
import classNames from 'classnames';

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
  label?: string;
};

const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
  return (
    <div className="flex flex-col">
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <select 
        className={classNames(
          'input', 
          className,
          'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed'
        )} 
        {...props}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
            className={option.disabled ? 'text-gray-400' : ''}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select; 