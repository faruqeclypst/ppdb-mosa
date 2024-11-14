import React from 'react';
import classNames from 'classnames';

type SkeletonProps = {
  className?: string;
};

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={classNames('animate-pulse bg-gray-300', className)} />
  );
};

export default Skeleton; 