import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

import { Eye, EyeOff, Search } from 'lucide-react';


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', showPasswordToggle, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const isSearchBar = type === 'search';
    const inputType = isPassword && showPassword ? 'text' : isSearchBar ? 'text' : type;

    return (
      <div className={`w-full`}>
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
          </label>
        )}

        <div className="flex items-center gap-1 px-2">
          {
            isSearchBar && (
              <div className=" text-primary-500"> 
                <Search />
              </div>
            )
          }
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-lg border border-secondary-300
              focus:outline-none ${isSearchBar ? '': 'focus:ring-2 focus:ring-primary-500 focus:border-transparent'}
              disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${isPassword && showPasswordToggle ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className=" text-secondary-400 hover:text-secondary-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }   
);

Input.displayName = 'Input';