import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'max-w-md w-[28rem]',
    md: 'max-w-lg w-[32rem]',
    lg: 'max-w-3xl w-[48rem]',
    xl: 'max-w-5xl w-[64rem]',
    '2xl': 'max-w-7xl w-[80rem]',
    'full': 'max-w-[95%] w-[95%]'
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={onClose}
            className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center overflow-hidden ${className}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: {
                  type: "spring",
                  duration: 0.5,
                  bounce: 0.3
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: 20,
                transition: {
                  duration: 0.2,
                  ease: 'easeInOut'
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={`${sizeClasses[size]} bg-white rounded-lg shadow-xl 
                         mx-4 my-8 max-h-[80vh] overflow-hidden ${className}`}
            >
              <div className="h-full overflow-y-auto w-full">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal; 