import React from 'react';
import Input from '../ui/Input';

interface AcademicFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formStatus: 'draft' | 'submitted';
  disabledInputClass: string;
  SectionTitle: React.FC<{ children: React.ReactNode }>;
}

export const AcademicForm: React.FC<AcademicFormProps> = ({
  formData,
  handleInputChange,
  formStatus,
  disabledInputClass,
  SectionTitle
}) => {
  const semesters = ['2', '3', '4'];
  const mapelList = [
    { label: 'Pendidikan Agama', mobileLabel: 'Pendidikan Agama', key: 'nilaiAgama' },
    { label: 'Bahasa Indonesia', mobileLabel: 'Bahasa Indonesia', key: 'nilaiBindo' },
    { label: 'Bahasa Inggris', mobileLabel: 'Bahasa Inggris', key: 'nilaiBing' },
    { label: 'Matematika', mobileLabel: 'Matematika', key: 'nilaiMtk' },
    { label: 'IPA', mobileLabel: 'IPA', key: 'nilaiIpa' }
  ];

  return (
    <div className="space-y-10">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {semesters.map((semester) => (
            <div key={semester} className="space-y-6">
              <SectionTitle>Semester {semester}</SectionTitle>
              <div className="space-y-4">
                {mapelList.map(({ label, mobileLabel, key }) => {
                  const fieldName = `${key}${semester}`;
                  const value = formData[fieldName] as string;
                  const isInvalid = value && (
                    isNaN(parseFloat(value)) || 
                    parseFloat(value) < 0 || 
                    parseFloat(value) > 100
                  );

                  return (
                    <div key={key} className="relative">
                      <Input
                        label={label}
                        mobilelabel={mobileLabel}
                        name={fieldName}
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => {
                          if (formStatus === 'submitted') return;
                          handleInputChange(e);
                        }}
                        onKeyPress={(e) => {
                          if (formStatus === 'submitted' || !/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        disabled={formStatus === 'submitted'}
                        className={`${disabledInputClass} ${isInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} 
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        required
                      />
                      {isInvalid && (
                        <div className="absolute right-2 top-[2.5rem] flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AcademicForm;
