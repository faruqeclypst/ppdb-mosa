import React, { SelectHTMLAttributes } from 'react';
import classNames from 'classnames';

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
  label?: React.ReactNode;
};

const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {label}
        </label>
      )}
      <select 
        className={classNames(
          'w-full px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 shadow-xs cursor-pointer', 
          className
        )} 
        {...props}
      >
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
            className={option.disabled ? 'text-zinc-400' : 'text-zinc-800'}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select; 