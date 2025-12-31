import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'lightoutline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'rounded-sm inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-700 focus:ring-4 focus:ring-primary-200',
    secondary: 'bg-primary-100 text-primary-300 hover:bg-secondary-200 focus:ring-4 focus:ring-secondary-200',
    outline: 'bg-white border border-secondary-300 text-primary-500 hover:bg-secondary-50 focus:ring-4 focus:ring-secondary-200',
    lightoutline: 'bg-white border border-secondary-100 text-primary-500 hover:bg-secondary-50 focus:ring-4 focus:ring-secondary-200',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4.5 py-2 text-xs lg:text-base',
    lg: 'px-6 py-1.5 text-xs',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {children}
          {icon && <span className="ml-2">{icon}</span>}
        </>
      )}
    </button>
  );
};