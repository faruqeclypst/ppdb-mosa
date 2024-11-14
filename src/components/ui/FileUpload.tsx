import React, { ChangeEvent } from 'react';

type FileUploadProps = {
  onChange: (files: FileList | null) => void;
  className?: string;
};

const FileUpload: React.FC<FileUploadProps> = ({ onChange, className }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    onChange(target.files);
  };

  return (
    <input
      type="file"
      onChange={handleFileChange}
      className={className}
    />
  );
};

export default FileUpload; 