import React, { ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button className={classNames('btn', className)} {...props}>
      {children}
    </button>
  );
};

export default Button; 