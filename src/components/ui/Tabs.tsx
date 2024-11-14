import React from 'react';
import classNames from 'classnames';

type Tab = {
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab?: number;
  onChange?: (index: number) => void;
  className?: string;
};

const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab = 0, 
  onChange,
  className 
}) => {
  const handleTabClick = (index: number) => {
    if (onChange) {
      onChange(index);
    }
  };

  return (
    <div className={className}>
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={classNames(
              'py-2 px-4 font-medium text-sm transition-colors duration-150',
              {
                'border-b-2 border-blue-500 text-blue-600': activeTab === index,
                'text-gray-500 hover:text-gray-700': activeTab !== index,
              }
            )}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs; 