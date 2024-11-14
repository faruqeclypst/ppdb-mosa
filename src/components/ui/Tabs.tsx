import React, { useState } from 'react';
import classNames from 'classnames';

type Tab = {
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  className?: string;
};

const Tabs: React.FC<TabsProps> = ({ tabs, className }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={className}>
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={classNames('py-2 px-4', {
              'border-b-2 border-blue-500': activeTab === index,
              'text-gray-500': activeTab !== index,
            })}
            onClick={() => setActiveTab(index)}
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