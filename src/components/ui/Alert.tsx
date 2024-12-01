import React from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
}

// Constants
const ALERT_DURATION = 5000;
const CONTAINER_CLASSES = classNames(
  'fixed z-50 flex flex-col',
  'bottom-0 left-0 ml-4',
  'gap-1 md:gap-2'
);

const ALERT_STYLES = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
};

const ALERT_ICONS = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationCircleIcon
};

// State
let alertContainer: HTMLDivElement | null = null;
let alerts: AlertItem[] = [];

// Helper functions
const createContainer = () => {
  alertContainer = document.createElement('div');
  alertContainer.className = CONTAINER_CLASSES;
  document.body.appendChild(alertContainer);
  return alertContainer;
};

const getContainer = () => alertContainer || createContainer();

const removeAlert = (root: any, alertId: string) => {
  alerts = alerts.filter(a => a.id !== alertId);
  if (alerts.length === 0) {
    root.unmount();
    alertContainer?.remove();
    alertContainer = null;
  } else {
    renderAlerts(root);
  }
};

const renderAlerts = (root: any) => {
  root.render(
    <AnimatePresence>
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => removeAlert(root, alert.id)}
        />
      ))}
    </AnimatePresence>
  );
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose, className }) => {
  const Icon = ALERT_ICONS[type];

  return (
    <div className={`rounded-lg p-4 mb-4 w-full ${ALERT_STYLES[type]} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className="w-5 h-5" />
          <p className="ml-3 text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const showAlert = (type: AlertType, message: string, duration: number = ALERT_DURATION) => {
  const container = getContainer();
  const alertId = Math.random().toString(36).substr(2, 9);
  const root = createRoot(container);

  alerts.push({ id: alertId, type, message });
  renderAlerts(root);

  setTimeout(() => removeAlert(root, alertId), duration);
  return alertId;
};

export default Alert; 