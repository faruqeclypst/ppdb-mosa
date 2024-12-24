import React from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';
import type { PPDBSettings } from '../../types/settings';
import classNames from 'classnames';

type ContactProps = {
  settings: PPDBSettings | null;
  variant?: 'default' | 'compact';
  className?: string;
};

const Contact: React.FC<ContactProps> = ({ settings, variant = 'default', className = '' }) => {
  return (
    <div className={classNames(
      'rounded-xl shadow-md h-full flex flex-col',
      variant === 'default' ? 'p-8' : 'p-7',
      className
    )}>
      <div className={classNames(
        "flex items-center gap-5 border-b border-slate-200 pb-5",
        variant === 'default' ? 'mb-7' : 'mb-6'
      )}>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm">
          <PhoneIcon className={classNames(
            'text-blue-600',
            variant === 'default' ? 'w-8 h-8' : 'w-7 h-7'
          )} />
        </div>
        <div>
          <h3 className={classNames(
            'font-semibold text-slate-800 mb-1',
            variant === 'default' ? 'text-2xl' : 'text-xl'
          )}>Kontak Panitia PPDB</h3>
          <p className="text-slate-600 text-sm">Hubungi kami pada jam kerja untuk informasi lebih lanjut</p>
        </div>
      </div>

      <div className="space-y-6">
        {settings?.contactWhatsapp && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              settings.contactWhatsapp.admin1,
              settings.contactWhatsapp.admin2,
              settings.contactWhatsapp.admin3,
              settings.contactWhatsapp.admin4
            ]
              .filter(admin => admin?.name && admin?.whatsapp)
              .map((admin, index) => (
                <a
                  key={index}
                  href={`https://wa.me/${admin?.whatsapp?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-white hover:bg-green-50/90 transition-all duration-300 rounded-xl p-4 border border-slate-200 hover:border-green-300 group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center border border-green-200 group-hover:scale-105 transition-transform">
                    <PhoneIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 group-hover:text-green-700 transition-colors truncate">
                      {admin?.name}
                    </p>
                    <p className="text-slate-500 group-hover:text-green-600 transition-colors text-sm truncate">
                      {admin?.whatsapp}
                    </p>
                  </div>
                </a>
              ))}
          </div>
        )}

        {/* <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              <p className="font-medium text-slate-800 text-sm">Jam Layanan</p>
            </div>
            <p className="text-slate-600 pl-5 text-sm font-medium group-hover:text-slate-800 transition-colors">
              08.00 - 16.00 WIB
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              <p className="font-medium text-slate-800 text-sm">Hari Kerja</p>
            </div>
            <p className="text-slate-600 pl-5 text-sm font-medium group-hover:text-slate-800 transition-colors">
              Senin - Sabtu
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Contact; 