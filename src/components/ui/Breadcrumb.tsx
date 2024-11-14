import React from 'react';
import { Link } from 'react-router-dom';

type BreadcrumbProps = {
  items: { label: string; to: string }[];
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="text-sm">
      {items.map((item, index) => (
        <span key={index}>
          <Link to={item.to} className="text-blue-600 hover:underline">
            {item.label}
          </Link>
          {index < items.length - 1 && ' / '}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb; 