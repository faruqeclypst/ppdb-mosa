import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type SidebarProps = {
  children?: ReactNode;
};

const Sidebar: React.FC<SidebarProps> = () => {
  const menuItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/pendaftar', label: 'Data Pendaftar' },
    { to: '/admin/pengaturan', label: 'Pengaturan' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 