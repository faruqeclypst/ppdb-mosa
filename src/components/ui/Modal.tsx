import React from 'react';
import { AnimatePresence } from 'framer-motion';
import classNames from 'classnames';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md', className = '' }) => {
  // Handle escape key dan body scrolling
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Simpan posisi scroll sebelum modal dibuka
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) {
        // Kembalikan posisi scroll saat modal ditutup
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-7xl',
    'full': 'max-w-[95%] w-[95%]'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className={classNames(
                  'relative bg-white rounded-lg shadow-xl w-full',
                  sizeClasses[size],
                  className
                )}
                onClick={e => e.stopPropagation()}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal; 