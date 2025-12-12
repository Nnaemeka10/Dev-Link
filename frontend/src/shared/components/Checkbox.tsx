import { forwardRef } from 'react';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
     <div className={`w-full ${className}`}>
        <div className="flex items-start">
          <div className="relative flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only peer"
              {...props}
            />
            <div className="w-5 h-5 border-2 border-secondary-300 rounded bg-white peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus:ring-2 peer-focus:ring-primary-200 transition-all cursor-pointer">
              <Check className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 absolute top-0.5 left-0.5 pointer-events-none" strokeWidth={3} />
            </div>
          </div>
          {label && (
            <label className="ml-3 text-sm text-secondary-700 cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox