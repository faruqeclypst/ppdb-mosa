import React from 'react';
import classNames from 'classnames';

type TabsProps = {
  tabs: {
    label: string;
    content: React.ReactNode;
  }[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div>
      <div className={`border-b border-gray-200 ${className}`}>
        <nav className="grid grid-cols-2 md:flex gap-1.5 -mb-px" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => onChange(index)}
              className={classNames(
                'py-2 px-2 md:px-4 md:py-3',
                'border-b-2 font-medium',
                'text-[13px] md:text-sm',
                'flex items-center justify-center text-center min-h-[44px]',
                'transition-colors duration-200',
                'flex-1 md:flex-none',
                activeTab === index
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span className="line-clamp-2">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs; 