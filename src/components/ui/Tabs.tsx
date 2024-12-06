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

// Tambahkan styles untuk hide scrollbar
const hideScrollbarStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  // Tambahkan style ke head saat komponen dimount
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = hideScrollbarStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div>
      <div className={`border-b border-gray-200 ${className}`}>
        <nav className="-mb-px flex" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => onChange(index)}
              className={classNames(
                'whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm',
                activeTab === index
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
};

export default Tabs; 