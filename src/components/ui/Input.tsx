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
        <label className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          {mobilelabel || label}
        </label>
      )}
      <input
        className={classNames(
          'w-full px-3 py-2 text-xs sm:text-sm font-medium text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 shadow-xs',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;