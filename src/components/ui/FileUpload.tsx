import React, { ChangeEvent, useState, useRef } from 'react';
import classNames from 'classnames';
import { showAlert } from './Alert';
import { 
  ArrowUpTrayIcon, 
  EyeIcon, 
  TrashIcon, 
  DocumentTextIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline';

type FileUploadProps = {
  label: string;
  name: string;
  accept?: string;
  onChange: (file: File | null) => void;
  onDelete?: () => void;
  className?: string;
  maxSize?: number;
  required?: boolean;
  showPreview?: boolean;
  value?: File | string | null;
  id?: string;
  showDeleteButton?: boolean;
  isDeleting?: boolean;
};

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  name, 
  accept = '.pdf', 
  onChange, 
  onDelete,
  className,
  maxSize = 2,
  required,
  showPreview = false,
  value,
  id,
  showDeleteButton = false,
  isDeleting = false
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Strip trailing asterisks from label string to prevent double asterisk display
  const cleanLabel = label.replace(/\s*\*+\s*$/, '').trim();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.size > maxSize * 1024 * 1024) {
        showAlert('error', `Ukuran file terlalu besar (maksimal ${maxSize}MB)`);
        event.target.value = '';
        return;
      }

      if (showPreview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFileClick = (file: File | string) => {
    if (typeof file === 'string') {
      window.open(file, '_blank');
    } else {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  const getFileName = (val: File | string) => {
    if (typeof val === 'string') {
      const parts = val.split('/');
      const lastPart = parts[parts.length - 1] || 'Dokumen Terunggah.pdf';
      // Remove long url params if any
      return decodeURIComponent(lastPart.split('?')[0]);
    }
    return val.name;
  };

  const hasFile = Boolean(value);

  return (
    <div className="flex flex-col space-y-1.5">
      {/* Field Label (tanpa truncate agar teks judul tampil utuh) */}
      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 leading-normal block">
        {cleanLabel}
        {required && <span className="text-rose-500 ml-1 font-extrabold">*</span>}
      </label>

      {showPreview && preview && (
        <div className="mb-2 relative w-24 h-24 mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-xl border border-zinc-200 shadow-sm"
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        id={id || name}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        required={required && !value}
        aria-label={cleanLabel}
      />

      {/* Empty State: Card to Upload */}
      {!hasFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={classNames(
            'group relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-200 hover:border-emerald-500 bg-zinc-50/50 hover:bg-emerald-50/30 rounded-2xl cursor-pointer transition-all duration-200 shadow-2xs',
            className
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 group-hover:border-emerald-200 group-hover:bg-emerald-50 flex items-center justify-center text-zinc-500 group-hover:text-emerald-700 shadow-2xs transition-colors mb-1.5">
            <ArrowUpTrayIcon className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-zinc-800 group-hover:text-emerald-800 transition-colors text-center">
            Pilih File PDF
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5 text-center">
            Maksimal {maxSize}MB (Format PDF)
          </p>
        </div>
      ) : (
        /* Uploaded State: Card showing file info and explicit action buttons */
        <div className="p-3 bg-white border border-emerald-200/80 rounded-2xl shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <DocumentTextIcon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-zinc-900 truncate" title={getFileName(value!)}>
                {getFileName(value!)}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium">
                Format PDF (Maks. {maxSize}MB)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => handleFileClick(value!)}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-800 border border-zinc-200/70 hover:border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <EyeIcon className="w-3.5 h-3.5" />
              <span>Lihat Berkas</span>
            </button>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Ganti</span>
            </button>

            {showDeleteButton && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-zinc-400 hover:text-rose-600 border border-zinc-200/70 hover:border-rose-200 transition-colors"
                title="Hapus berkas"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;