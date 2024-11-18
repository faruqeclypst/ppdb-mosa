import React, { ChangeEvent, useState, useRef } from 'react';
import classNames from 'classnames';
import { showAlert } from './Alert';

type FileUploadProps = {
  label: string;
  name: string;
  accept?: string;
  onChange: (file: File | null) => void;
  className?: string;
  maxSize?: number;
  required?: boolean;
  showPreview?: boolean;
  value?: File | string | null;
  id?: string;
};

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  name, 
  accept, 
  onChange, 
  className,
  maxSize = 4,
  required,
  showPreview = false,
  value,
  id
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.size > maxSize * 1024 * 1024) {
        showAlert('error', `Ukuran file tidak boleh lebih dari ${maxSize}MB`);
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

  const getButtonLabel = () => {
    if (!value) return 'Pilih';
    return 'Ganti';
  };

  const handleFileClick = (file: File | string) => {
    if (typeof file === 'string') {
      // Jika file adalah URL (sudah terupload)
      window.open(file, '_blank');
    } else {
      // Jika file adalah File object (baru diupload)
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      // Cleanup URL object
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {showPreview && preview && (
        <div className="mb-4 relative w-32 h-32 mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg shadow-md"
          />
        </div>
      )}

      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={classNames(
            'py-2 px-4 rounded-lg text-sm font-semibold whitespace-nowrap',
            'bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0',
            className
          )}
        >
          {getButtonLabel()}
        </button>

        <input
          ref={inputRef}
          type="file"
          name={name}
          id={id || name}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          required={required && !value}
          aria-label={label}
        />

        {value && (
          <div className="flex items-center justify-between flex-1 bg-gray-50 rounded-lg px-4 py-2 min-w-0">
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => handleFileClick(value)}
                className="text-sm text-blue-600 hover:text-blue-800 truncate cursor-pointer text-left w-full"
              >
                {typeof value === 'string' 
                  ? value.split('/').pop() 
                  : value.name}
              </button>
            </div>
            {typeof value === 'string' && (
              <button
                type="button"
                onClick={() => window.open(value, '_blank')}
                className="ml-4 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm flex-shrink-0"
              >
                Lihat File
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload; 