import React, { ReactNode, FormEvent } from 'react';

interface FormProps {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
}

const Form: React.FC<FormProps> = ({ children, onSubmit }) => {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {children}
    </form>
  );
};

export default Form; 