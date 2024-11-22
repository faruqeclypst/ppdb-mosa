import React from 'react';
import classNames from 'classnames';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  itemsPerPage?: number;
};

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className,
  totalItems = 0,
  itemsPerPage = 10
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={classNames('flex flex-col md:flex-row items-center justify-between gap-4 pt-4', className)}>
      {/* Info jumlah data - Disembunyikan di mobile */}
      <p className="hidden md:block text-sm text-gray-600">
        Menampilkan {startItem} - {endItem} dari {totalItems} data
      </p>

      {/* Mobile Pagination */}
      <div className="md:hidden flex items-center justify-center gap-2 w-full">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={classNames(
            'p-2 rounded-lg',
            currentPage === 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          )}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <span className="text-sm text-gray-600">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={classNames(
            'p-2 rounded-lg',
            currentPage === totalPages ? 'text-gray-400 bg-gray-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          )}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Pagination */}
      <div className="hidden md:flex space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={classNames(
              'px-3 py-1 rounded',
              page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            )}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Pagination; 