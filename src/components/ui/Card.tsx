import React, { ReactNode } from 'react';
import classNames from 'classnames';

type CardProps = {
  children: ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={classNames('bg-white shadow-md rounded-lg p-4', className)}>
      {children}
    </div>
  );
};

export default Card; 