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
      <label className="mb-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={classNames(
          'input border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        required={required}
      />
    </div>
  );
};

export default DatePicker; 