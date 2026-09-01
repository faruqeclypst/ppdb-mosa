import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon, 
  Cog6ToothIcon, 
  AdjustmentsHorizontalIcon, 
  DocumentTextIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

type MenuItem = {
  name: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

const menuSections: MenuSection[] = [
  {
    title: 'SPMB UTAMA (REGULER)',
    items: [
      {
        name: 'Dashboard Reguler',
        icon: AcademicCapIcon,
        path: '/admin'
      },
      {
        name: 'Pendaftar Reguler',
        icon: UserGroupIcon,
        path: '/admin/pendaftar'
      },
      {
        name: 'Draft Reguler',
        icon: DocumentTextIcon,
        path: '/admin/draft'
      }
    ]
  },
  {
    title: 'SPMB JARAK JAUH (PJJ)',
    items: [
      {
        name: 'Dashboard PJJ',
        icon: BuildingOfficeIcon,
        path: '/admin/dashboard-pjj',
        badge: 'Mitra'
      },
      {
        name: 'Pendaftar PJJ',
        icon: UserGroupIcon,
        path: '/admin/pendaftar-pjj'
      },
      {
        name: 'Draft PJJ',
        icon: DocumentTextIcon,
        path: '/admin/draft-pjj'
      }
    ]
  },
  {
    title: 'SISTEM & MASTER',
    items: [
      {
        name: 'Manajemen Admin',
        icon: Cog6ToothIcon,
        path: '/admin/users'
      },
      {
        name: 'Pengaturan SPMB',
        icon: AdjustmentsHorizontalIcon,
        path: '/admin/settings'
      }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ mobile, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobile && onClose) onClose();
  };

  return (
    <aside 
      className={classNames(
        "bg-[#0d1612] text-zinc-200 border-r border-emerald-950/60 w-64 select-none overflow-hidden flex flex-col",
        mobile 
          ? "relative h-full" 
          : "fixed inset-y-0 left-0 z-30 shadow-2xl hidden md:flex"
      )}
    >
      {/* Subtle Background Mesh Glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Sidebar Branding Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/5 relative z-10 shrink-0 bg-[#0d1612]/90 backdrop-blur-md">
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="p-2 rounded-2xl bg-white/10 border border-white/15 shadow-md group-hover:scale-105 transition-transform duration-300">
            <img 
              src="/images/mosa.png" 
              alt="Logo MOSA" 
              className="w-8 h-8 object-contain" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black text-white tracking-wide uppercase">
                SPMB MOSA
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider block">
              Executive Console
            </span>
          </div>
        </Link>

        {mobile && onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu Items */}
      <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6 relative z-10 custom-scrollbar">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3 py-1 text-[9px] font-extrabold text-zinc-400 uppercase tracking-[0.18em]">
              {section.title}
            </div>

            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.path === '/admin' 
                  ? location.pathname === '/admin' 
                  : location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={classNames(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative',
                        isActive
                          ? 'bg-emerald-500/15 text-white font-bold border border-emerald-500/30 shadow-sm shadow-emerald-950/40'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 font-medium border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={classNames(
                          'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          isActive 
                            ? 'bg-emerald-500 text-zinc-950' 
                            : 'bg-white/5 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/10'
                        )}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRightIcon className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-white/5 bg-[#0a110e] relative z-10 shrink-0">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-zinc-300">Live Database</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            v2.2.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;