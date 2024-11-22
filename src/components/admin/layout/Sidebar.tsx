import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

type MenuItem = {
  name: string;
  icon: React.ElementType;
  path: string;
}

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

const menuItems: MenuItem[] = [
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

const SidebarItem: React.FC<{
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={classNames(
        'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <item.icon className={classNames(
        'w-5 h-5 transition-transform',
        isActive ? 'transform scale-110' : ''
      )} />
      <span className="font-medium">{item.name}</span>
    </button>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobile && onClose) onClose();
  };

  return (
    <div className={classNames(
      "bg-white h-full flex flex-col border-r",
      mobile ? "" : "shadow-lg"
    )}>
      <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-blue-50 to-white">
        <h1 className="text-xl font-bold text-gray-800">PPDB MoSa</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 