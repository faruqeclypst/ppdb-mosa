import React, { useState } from 'react';
import classNames from 'classnames';

interface StudentPhotoAvatarProps {
  photo?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'amber' | 'emerald' | 'blue';
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const StudentPhotoAvatar: React.FC<StudentPhotoAvatarProps> = ({
  photo,
  name,
  className,
  size = 'md',
  variant = 'amber',
  onClick,
  title,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'D';

  const sizeClass = {
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-9 h-9 text-xs rounded-xl',
    lg: 'w-10 h-10 text-xs rounded-xl',
  }[size];

  const gradientClass = {
    amber: 'from-amber-600 to-amber-400 text-white',
    emerald: 'from-emerald-800 to-emerald-600 text-white',
    blue: 'from-blue-700 to-blue-500 text-white',
  }[variant];

  if (!photo || hasError) {
    return (
      <div
        className={classNames(
          sizeClass,
          'bg-gradient-to-tr font-black flex items-center justify-center shadow-2xs shrink-0 select-none',
          gradientClass,
          className
        )}
        title={title || name}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'relative shrink-0 overflow-hidden select-none',
        sizeClass,
        onClick ? 'cursor-pointer group' : '',
        className
      )}
      onClick={onClick}
      title={title || 'Klik untuk perbesar foto'}
    >
      {/* Skeleton shimmer before image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-200 animate-pulse rounded-[inherit]" />
      )}

      <img
        src={photo}
        alt={name || 'Pas Foto'}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={classNames(
          'w-full h-full object-cover border border-zinc-200 shadow-2xs transition-all duration-200',
          sizeClass,
          onClick ? 'group-hover:scale-110' : '',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};

export default StudentPhotoAvatar;
