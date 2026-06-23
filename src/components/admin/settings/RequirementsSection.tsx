import React from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface RequirementsSectionProps {
  jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj';
  requirements: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}

const RequirementsSection: React.FC<RequirementsSectionProps> = ({ 
  jalur, 
  requirements = [], 
  onAdd, 
  onRemove, 
  onUpdate 
}) => {
  const jalurConfig = {
    jalurPrestasi: {
      color: 'blue',
      label: 'Prestasi'
    },
    jalurReguler: {
      color: 'green',
      label: 'Reguler'
    },
    jalurUndangan: {
      color: 'purple',
      label: 'Undangan'
    },
    jalurPjj: {
      color: 'amber',
      label: 'PJJ'
    }
  };

  const config = jalurConfig[jalur];

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <div className="border-b pb-3">
        <h4 className="font-medium text-gray-900">
          Persyaratan Jalur {config.label}
        </h4>
      </div>

      <div className="space-y-2">
        {requirements.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <div className="flex justify-center mb-2">
              <svg className={`w-6 h-6 text-${config.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 px-4">
              Belum ada persyaratan untuk jalur {config.label.toLowerCase()}
            </p>
          </div>
        ) : (
          requirements.map((req, index) => (
            <div 
              key={index} 
              className={`group flex items-center gap-2 bg-white rounded-lg border p-2 hover:border-${config.color}-200 transition-colors`}
            >
              <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center bg-${config.color}-50 rounded-lg`}>
                <span className={`text-sm font-medium text-${config.color}-600`}>{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={req}
                  onChange={(e) => onUpdate(index, e.target.value)}
                  placeholder={`Persyaratan ${index + 1}`}
                  className="w-full border-0 focus:ring-0 bg-transparent px-2"
                />
              </div>
              <Button
                onClick={() => onRemove(index)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t mt-2">
        <div className="text-sm text-gray-500">
          {requirements.length > 0 && (
            <span>{requirements.length} persyaratan</span>
          )}
        </div>
        <Button
          onClick={onAdd}
          className={`bg-white text-${config.color}-600 hover:bg-${config.color}-50 
                     border border-${config.color}-200 shadow-sm px-3 py-1.5 
                     text-sm font-medium rounded-lg`}
        >
          Tambah
        </Button>
      </div>
    </div>
  );
};

export default RequirementsSection;
