import React from 'react';
import classNames from 'classnames';

type DatePickerProps = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  className?: string;
  required?: boolean;
};

const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  className,
  required 
}) => {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={classNames(
          'w-full px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 shadow-xs cursor-pointer',
          className
        )}
        required={required}
      />
    </div>
  );
};

export default DatePicker; 