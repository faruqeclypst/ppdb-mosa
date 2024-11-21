import React from 'react';
import classNames from 'classnames';

type Tab = {
  label: string | ((props: { isActive: boolean }) => React.ReactNode);
  mobileLabel?: string;
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
      <div className="bg-white border-b">
        <div className="flex flex-wrap">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={classNames(
                'py-3 px-4 font-medium text-sm transition-colors duration-150',
                'flex-1 md:flex-none min-w-[100px] max-w-[150px]',
                'border-b-2',
                {
                  'border-blue-500 text-blue-600 bg-blue-50': activeTab === index,
                  'border-transparent text-gray-500 hover:text-gray-700': activeTab !== index,
                }
              )}
              onClick={() => handleTabClick(index)}
            >
              {typeof tab.label === 'string' ? (
                <>
                  <span className="hidden md:block">{tab.label}</span>
                  <span className="block md:hidden text-xs">
                    {tab.mobileLabel || tab.label}
                  </span>
                </>
              ) : (
                tab.label({ isActive: activeTab === index })
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 md:p-4">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs; 