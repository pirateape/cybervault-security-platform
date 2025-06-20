import * as React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
  colorScheme?: 'brand' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  uiSize?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles =
  'block w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition disabled:opacity-50 disabled:pointer-events-none';

const sizeStyles = {
  xs: 'text-xs px-2 py-1 h-6',
  sm: 'text-sm px-3 py-1.5 h-8',
  md: 'text-base px-4 py-2 h-10',
  lg: 'text-lg px-6 py-3 h-12',
};

const variantStyles = {
  outline: {
    brand: 'border border-blue-300 focus:ring-blue-500',
    primary: 'border border-indigo-300 focus:ring-indigo-500',
    secondary: 'border border-gray-300 focus:ring-gray-500',
    danger: 'border border-red-300 focus:ring-red-500',
    success: 'border border-green-300 focus:ring-green-500',
    warning: 'border border-yellow-300 focus:ring-yellow-400',
  },
  filled: {
    brand: 'bg-blue-50 border border-blue-200 focus:ring-blue-500',
    primary: 'bg-indigo-50 border border-indigo-200 focus:ring-indigo-500',
    secondary: 'bg-gray-50 border border-gray-200 focus:ring-gray-500',
    danger: 'bg-red-50 border border-red-200 focus:ring-red-500',
    success: 'bg-green-50 border border-green-200 focus:ring-green-500',
    warning: 'bg-yellow-50 border border-yellow-200 focus:ring-yellow-400',
  },
  flushed: {
    brand: 'border-b border-blue-300 focus:ring-blue-500 rounded-none',
    primary: 'border-b border-indigo-300 focus:ring-indigo-500 rounded-none',
    secondary: 'border-b border-gray-300 focus:ring-gray-500 rounded-none',
    danger: 'border-b border-red-300 focus:ring-red-500 rounded-none',
    success: 'border-b border-green-300 focus:ring-green-500 rounded-none',
    warning: 'border-b border-yellow-300 focus:ring-yellow-400 rounded-none',
  },
  unstyled: {
    brand: '',
    primary: '',
    secondary: '',
    danger: '',
    success: '',
    warning: '',
  },
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'outline',
      colorScheme = 'brand',
      uiSize = 'md',
      leftIcon,
      rightIcon,
      className,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      baseStyles,
      sizeStyles[uiSize],
      variantStyles[variant][colorScheme],
      className
    );
    return (
      <div className="relative flex items-center">
        {leftIcon && <span className="absolute left-3" aria-hidden="true">{leftIcon}</span>}
        <input
          ref={ref}
          className={clsx(classes, leftIcon && 'pl-8', rightIcon && 'pr-8')}
          aria-invalid={props['aria-invalid']}
          aria-required={props.required}
          {...props}
        />
        {rightIcon && <span className="absolute right-3" aria-hidden="true">{rightIcon}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input'; 