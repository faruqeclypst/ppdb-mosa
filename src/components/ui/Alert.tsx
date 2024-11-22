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

type AlertType = 'success' | 'error' | 'info' | 'warning';

let alertContainer: HTMLDivElement | null = null;
let alerts: { id: string; type: AlertType; message: string }[] = [];

const createContainer = () => {
  alertContainer = document.createElement('div');
  alertContainer.className = classNames(
    'fixed z-50 flex flex-col',
    'md:bottom-4 md:left-4 md:top-auto md:right-auto',
    'top-0 right-0 left-0 md:left-auto',
    'gap-1 md:gap-2'
  );
  document.body.appendChild(alertContainer);
  return alertContainer;
};

const getContainer = () => {
  return alertContainer || createContainer();
};

const Alert: React.FC<{ type: AlertType; message: string; onClose: () => void }> = ({ 
  type, 
  message, 
  onClose 
}) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationCircleIcon
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  const Icon = icons[type];

  const isMobile = window.innerWidth < 768;

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? -20 : 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isMobile ? -20 : 20, scale: 0.95 }}
      className={classNames(
        'flex items-center gap-3 border shadow-sm',
        colors[type],
        isMobile 
          ? 'mx-2 mt-2 p-3 rounded-lg text-sm' 
          : 'w-full max-w-sm p-4 rounded-lg'
      )}
    >
      <div className="flex-shrink-0 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <span className="flex-1 leading-5">{message}</span>
      <div className="flex-shrink-0 flex items-center justify-center">
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const showAlert = (type: AlertType, message: string) => {
  const container = getContainer();
  const alertId = Math.random().toString(36).substr(2, 9);
  const root = createRoot(container);

  alerts.push({ id: alertId, type, message });

  root.render(
    <AnimatePresence>
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => {
            alerts = alerts.filter(a => a.id !== alert.id);
            if (alerts.length === 0) {
              root.unmount();
              container.remove();
              alertContainer = null;
            } else {
              root.render(
                <AnimatePresence>
                  {alerts.map(alert => (
                    <Alert
                      key={alert.id}
                      type={alert.type}
                      message={alert.message}
                      onClose={() => {
                        alerts = alerts.filter(a => a.id !== alert.id);
                        if (alerts.length === 0) {
                          root.unmount();
                          container.remove();
                          alertContainer = null;
                        }
                      }}
                    />
                  ))}
                </AnimatePresence>
              );
            }
          }}
        />
      ))}
    </AnimatePresence>
  );

  setTimeout(() => {
    alerts = alerts.filter(a => a.id !== alertId);
    if (alerts.length === 0) {
      root.unmount();
      container.remove();
      alertContainer = null;
    } else {
      root.render(
        <AnimatePresence>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              type={alert.type}
              message={alert.message}
              onClose={() => {
                alerts = alerts.filter(a => a.id !== alert.id);
                if (alerts.length === 0) {
                  root.unmount();
                  container.remove();
                  alertContainer = null;
                }
              }}
            />
          ))}
        </AnimatePresence>
      );
    }
  }, 5000);

  return alertId;
};

export default Alert; 