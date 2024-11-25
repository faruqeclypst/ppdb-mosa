import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
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
  collapsed?: boolean;
}> = ({ item, isActive, onClick, collapsed }) => (
  <li>
    <button
      onClick={onClick}
      className={classNames(
        'w-full flex items-center transition-colors duration-200',
        'px-4 py-2.5',
        isActive
          ? 'text-blue-600 bg-blue-50/50 font-medium'
          : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900',
        'rounded-lg relative group'
      )}
    >
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        <item.icon className={classNames(
          'transition-all',
          'w-5 h-5'
        )} />
      </div>
      
      <div className={classNames(
        'flex-1 transition-all duration-300 overflow-hidden text-left',
        collapsed ? 'w-0 ml-0' : 'ml-3'
      )}>
        <span className="font-medium whitespace-nowrap">
          {item.name}
        </span>
      </div>

      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs 
                      rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                      transition-all duration-200 whitespace-nowrap z-50">
          {item.name}
        </div>
      )}
    </button>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(!mobile);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobile && onClose) onClose();
  };

  return (
    <div 
      className={classNames(
        "bg-white h-full flex flex-col transition-all duration-300 relative",
        mobile ? "" : "shadow-sm fixed left-0 top-0 bottom-0 border-r",
        isCollapsed ? "w-[64px]" : "w-64"
      )}
      onMouseEnter={() => !mobile && setIsCollapsed(false)}
      onMouseLeave={() => !mobile && setIsCollapsed(true)}
    >
      <div className="flex-1 overflow-hidden hover:overflow-y-auto py-4 mt-16">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              collapsed={isCollapsed}
            />
          ))}
        </ul>
      </div>

      <div className="p-2 border-t bg-gray-50/50">
        <div className={classNames(
          'w-full flex items-center transition-colors duration-200',
          'px-4 py-2.5',
          'text-gray-600 rounded-lg'
        )}>
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          
          <div className={classNames(
            'flex-1 transition-all duration-300 overflow-hidden text-left',
            isCollapsed ? 'w-0 ml-0' : 'ml-3'
          )}>
            <p className="text-xs font-medium text-gray-900 truncate whitespace-nowrap">v1.0.0</p>
            <p className="text-[10px] text-gray-500 truncate whitespace-nowrap">© 2024 PPDB MOSA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 