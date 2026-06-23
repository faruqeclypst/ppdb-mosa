import React, { useState } from 'react';
import schoolData from '../../utils/school.json';

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  disabled,
  required,
  className,
  name
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Filter sekolah berdasarkan pencarian
  const filteredSchools = schoolData.filter(school =>
    school.nm_sekolah.toLowerCase().includes(search.toLowerCase()) ||
    school.nm_rayon.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 100);

  // Helper untuk mendapatkan rayon dari nama sekolah
  const getRayonFromSchoolName = (schoolName: string) => {
    const school = schoolData.find(s => s.nm_sekolah === schoolName);
    return school?.nm_rayon || '';
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          className={`w-full px-3 py-2 border rounded-md ${className}`}
          placeholder={value || "Ketik untuk mencari sekolah..."}
          value={isFocused ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setSearch('');
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setIsOpen(false);
            }, 200);
          }}
          disabled={disabled}
        />
        
        <input 
          type="hidden"
          name={name}
          value={value}
          onChange={onChange}
        />
        
        {isOpen && isFocused && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <div
                  key={school.npsn}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    onChange({
                      target: {
                        name,
                        value: school.nm_sekolah
                      }
                    } as React.ChangeEvent<HTMLInputElement>);
                    setSearch(school.nm_sekolah);
                    setIsOpen(false);
                    setIsFocused(false);
                  }}
                >
                  <div className="font-medium">{school.nm_sekolah}</div>
                  <div className="text-sm text-gray-500">{school.nm_rayon}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">
                Tidak ada sekolah yang ditemukan
              </div>
            )}
          </div>
        )}
      </div>
      
      {value && !isFocused && (
        <div className="mt-2 text-sm">
          <div className="font-medium text-gray-700">Sekolah dipilih:</div>
          <div className="text-gray-600">{value}</div>
          <div className="text-gray-500">({getRayonFromSchoolName(value)})</div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
