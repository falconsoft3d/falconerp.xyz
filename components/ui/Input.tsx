'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const { primaryColor } = useTheme();
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 placeholder:text-gray-400 ${className}`}
          style={{
            '--tw-ring-color': primaryColor,
          } as React.CSSProperties}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}40`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '';
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
