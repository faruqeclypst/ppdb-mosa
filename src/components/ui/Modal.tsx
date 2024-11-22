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
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
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