import * as React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme?: 'brand' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

const baseStyles =
  'inline-flex items-center justify-center font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition disabled:opacity-50 disabled:pointer-events-none';

const sizeStyles = {
  xs: 'text-xs px-2 py-1 h-6',
  sm: 'text-sm px-3 py-1.5 h-8',
  md: 'text-base px-4 py-2 h-10',
  lg: 'text-lg px-6 py-3 h-12',
};

const variantStyles = {
  solid: {
    brand: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
  },
  outline: {
    brand: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    primary: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    secondary: 'border border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
    success: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
    warning: 'border border-yellow-500 text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-400',
  },
  ghost: {
    brand: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    primary: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    secondary: 'text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    success: 'text-green-600 hover:bg-green-50 focus:ring-green-500',
    warning: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-400',
  },
  link: {
    brand: 'text-blue-600 underline hover:text-blue-800 focus:ring-blue-500',
    primary: 'text-indigo-600 underline hover:text-indigo-800 focus:ring-indigo-500',
    secondary: 'text-gray-600 underline hover:text-gray-800 focus:ring-gray-500',
    danger: 'text-red-600 underline hover:text-red-800 focus:ring-red-500',
    success: 'text-green-600 underline hover:text-green-800 focus:ring-green-500',
    warning: 'text-yellow-600 underline hover:text-yellow-800 focus:ring-yellow-400',
  },
};

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      children,
      variant = 'solid',
      colorScheme = 'brand',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      as = 'button',
      ...props
    },
    ref
  ) => {
    const Comp = as as any;
    const isButton = as === 'button' || !as;
    return (
      <Comp
        ref={ref}
        type={isButton ? (props.type || 'button') : undefined}
        className={clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant][colorScheme],
          className
        )}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        disabled={isButton ? (disabled || isLoading) : undefined}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin mr-2" aria-hidden="true">⏳</span>
        )}
        {leftIcon && <span className="mr-2" aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button'; 