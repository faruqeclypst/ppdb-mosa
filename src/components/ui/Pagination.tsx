import React from 'react';
import classNames from 'classnames';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
};

// Komponen untuk info items
const ItemsInfo: React.FC<{
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}> = ({ currentPage, itemsPerPage, totalItems }) => (
  <div className="text-sm text-gray-600 w-[280px] flex-shrink-0">
    <span className="hidden sm:inline">Menampilkan </span>
    <span className="font-semibold text-gray-900">
      {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
    </span>
    <span className="mx-1">-</span>
    <span className="font-semibold text-gray-900">
      {Math.min(currentPage * itemsPerPage, totalItems)}
    </span>
    <span className="mx-1">dari</span>
    <span className="font-semibold text-gray-900">{totalItems}</span>
    <span className="hidden sm:inline"> data</span>
  </div>
);

// Komponen untuk tombol navigasi
const NavigationButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  direction: 'prev' | 'next';
}> = ({ onClick, disabled, direction }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={classNames(
      "relative inline-flex items-center justify-center w-10 flex-shrink-0",
      "text-sm font-medium border transition-colors",
      direction === 'prev' ? "rounded-l-lg" : "rounded-r-lg -ml-px",
      disabled
        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
    )}
  >
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === 'prev' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  </button>
);

// Komponen untuk info halaman
const PageInfo: React.FC<{
  currentPage: number;
  totalPages: number;
}> = ({ currentPage, totalPages }) => (
  <div className="relative inline-flex items-center justify-center w-[120px] flex-shrink-0 text-sm font-medium border-t border-b bg-white text-gray-700">
    Pages {currentPage} of {totalPages}
  </div>
);

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white min-h-[52px] w-full">
      <ItemsInfo 
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />

      <div className="inline-flex rounded-md shadow-sm h-10 flex-shrink-0">
        <NavigationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          direction="prev"
        />
        
        <PageInfo 
          currentPage={currentPage}
          totalPages={totalPages}
        />
        
        <NavigationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          direction="next"
        />
      </div>
    </div>
  );
};

export default Pagination; 