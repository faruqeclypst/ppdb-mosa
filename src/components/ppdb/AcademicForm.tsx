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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {semesters.map((semester) => (
          <div key={semester} className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
            <div className="p-5 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
              <SectionTitle>Nilai Rapor Semester {semester}</SectionTitle>
              <div className="space-y-3.5">
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
                        className={`${disabledInputClass} ${isInvalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} 
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        required
                        placeholder="0 - 100"
                      />
                      {isInvalid && (
                        <div className="absolute right-2 top-[2.3rem] flex items-center">
                          <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicForm;
