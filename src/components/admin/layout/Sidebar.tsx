import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: HomeIcon,
      path: '/admin'
    },
    {
      name: 'Data Pendaftar',
      icon: UserGroupIcon,
      path: '/admin/pendaftar'
    },
    {
      name: 'Manajemen Admin',
      icon: Cog6ToothIcon,
      path: '/admin/users'
    },
    {
      name: 'Pengaturan PPDB',
      icon: AdjustmentsHorizontalIcon,
      path: '/admin/settings'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={classNames(
      "bg-white h-full flex flex-col border-r",
      mobile ? "" : "shadow-sm"
    )}>
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">PPDB MoSa</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={classNames(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 