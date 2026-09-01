import React, { useState, useEffect, useRef } from 'react';
import { searchSchools, SchoolItem } from '../../services/schoolApi';
import { 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  PencilSquareIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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
  const [results, setResults] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced live API search
  useEffect(() => {
    if (!isFocused || !search.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (search.trim().length >= 2) {
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const schools = await searchSchools(search, 25);
          setResults(schools);
        } catch (err) {
          console.error('Search school error:', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 350);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, isFocused]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSchool = (schoolName: string) => {
    onChange({
      target: {
        name,
        value: schoolName
      }
    } as React.ChangeEvent<HTMLInputElement>);
    setSearch('');
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            className={`w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 shadow-2xs ${className}`}
            placeholder={value ? value : "Ketik nama atau NPSN sekolah asal..."}
            value={isFocused ? search : (value === 'SEKOLAH LAIN' ? 'SEKOLAH LAIN (INPUT MANUAL)' : value)}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setSearch('');
              setIsOpen(true);
            }}
            disabled={disabled}
          />
          
          <div className="absolute left-3 text-zinc-400 pointer-events-none">
            {loading ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <MagnifyingGlassIcon className="w-4 h-4" />
            )}
          </div>

          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                handleSelectSchool('');
                setIsFocused(true);
                setIsOpen(true);
              }}
              className="absolute right-3 text-xs text-zinc-400 hover:text-zinc-600 px-1 py-0.5"
              title="Ganti sekolah"
            >
              Ubah
            </button>
          )}
        </div>
        
        <input 
          type="hidden"
          name={name}
          value={value}
          onChange={onChange}
        />
        
        {/* Floating Dropdown Results */}
        {isOpen && isFocused && (
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-1 divide-y divide-zinc-50">
            {/* Quick Helper Banner */}
            <div className="px-3 py-2 text-[11px] text-zinc-500 bg-zinc-50/80 rounded-xl flex items-center justify-between">
              <span>{loading ? 'Mencari ke database Dapodik / Kemendikbud...' : search.length < 2 ? 'Ketik minimal 2 karakter untuk mencari...' : `Ditemukan ${results.length} sekolah`}</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">API Live</span>
            </div>

            {/* List Results */}
            {results.length > 0 && results.map((school) => {
              const addressParts = [
                school.alamat?.nama_kecamatan ? `Kec. ${school.alamat.nama_kecamatan}` : '',
                school.alamat?.nama_kabupaten || '',
                school.alamat?.nama_provinsi || ''
              ].filter(Boolean).join(', ');

              return (
                <div
                  key={school.npsn || school.nama}
                  className="p-3 cursor-pointer hover:bg-emerald-50/50 rounded-xl transition-colors group"
                  onClick={() => handleSelectSchool(school.nama)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-zinc-800 group-hover:text-emerald-800 transition-colors">
                        {school.nama}
                      </div>
                      
                      {addressParts && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 truncate">
                          <MapPinIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{addressParts}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {school.npsn && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
                          NPSN: {school.npsn}
                        </span>
                      )}
                      {school.statusSatuanPendidikan && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          school.statusSatuanPendidikan.toUpperCase() === 'NEGERI' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {school.statusSatuanPendidikan}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {!loading && search.length >= 2 && results.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500">Tidak menemukan sekolah dengan kata kunci "{search}".</p>
                <p className="text-[11px] text-zinc-400 mt-1">Anda dapat memilih opsi input manual di bawah ini.</p>
              </div>
            )}

            {/* Always available fallback: SEKOLAH LAIN / MANUAL */}
            <div
              className="p-3 cursor-pointer hover:bg-amber-50/80 rounded-xl transition-colors border-t border-dashed border-zinc-200 mt-1 bg-zinc-50/50"
              onClick={() => handleSelectSchool('SEKOLAH LAIN')}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <PencilSquareIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-900">
                    Sekolah Lainnya (Input Manual)
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Pilih jika nama sekolah tidak ada di daftar pencarian
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected School Confirmation Tag */}
      {value && !isFocused && (
        <div className="mt-2 p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <BuildingOfficeIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Sekolah Asal Dipilih</span>
              <span className="text-xs font-semibold text-emerald-950 truncate block">
                {value === 'SEKOLAH LAIN' ? 'SEKOLAH LAIN (INPUT MANUAL)' : value}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
            Terpilih
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
