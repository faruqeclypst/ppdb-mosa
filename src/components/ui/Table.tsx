import React from 'react';

interface TableProps {
  headers: (string | { content: React.ReactNode })[];
  data: React.ReactNode[][];
  className?: string;
}

const Table: React.FC<TableProps> = ({ headers, data, className }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full">
        {/* Header */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  {typeof header === 'string' ? header : header.content}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Body */}
        <tbody className="bg-white">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
            >
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex} 
                  className="px-6 py-4 text-sm text-gray-900"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
