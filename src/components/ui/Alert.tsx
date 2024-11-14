import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

type AlertProps = {
  type?: AlertType;
  message: string;
  className?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
};

const Alert: React.FC<AlertProps> = ({ 
  type = 'info', 
  message, 
  className,
  onClose,
  autoClose = false,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: <XCircleIcon className="h-5 w-5 text-red-400" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
    },
  };

  const style = typeStyles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={classNames(
            'border rounded-lg p-4 flex items-start',
            style.bg,
            style.border,
            style.text,
            className
          )}
          role="alert"
        >
          <div className="flex-shrink-0">{style.icon}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="ml-auto flex-shrink-0 -mx-1.5 -my-1.5 p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Utility function untuk menampilkan alert global
export const showAlert = (
  type: AlertType,
  message: string,
  duration: number = 5000
): string => {
  // Generate unique ID untuk alert
  const alertId = `alert-${Date.now()}`;
  
  // Cari atau buat container untuk alert
  let container = document.getElementById('alert-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alert-container';
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  // Buat element untuk alert
  const alertElement = document.createElement('div');
  alertElement.id = alertId;
  container.appendChild(alertElement);

  // Render alert
  const root = createRoot(alertElement);
  root.render(
    <Alert
      type={type}
      message={message}
      autoClose={duration > 0}
      duration={duration}
      onClose={() => {
        root.unmount();
        alertElement.remove();
        if (container!.childNodes.length === 0) {
          container!.remove();
        }
      }}
    />
  );

  return alertId;
};

export default Alert; 