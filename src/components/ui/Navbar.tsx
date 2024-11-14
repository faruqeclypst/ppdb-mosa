import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';

type NavLink = {
  to: string;
  label: string;
};

type NavbarProps = {
  links: NavLink[];
  className?: string;
  isTransparent?: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ links, className, isTransparent }) => {
  const location = useLocation();

  return (
    <nav className={className}>
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        
        return (
          <Link
            key={link.to}
            to={link.to}
            className={classNames(
              'px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
              isTransparent ? (
                isActive 
                  ? 'text-white font-bold hover:bg-white/10'
                  : 'text-white hover:bg-white/10'
              ) : (
                isActive
                  ? 'text-blue-600 hover:bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar; 