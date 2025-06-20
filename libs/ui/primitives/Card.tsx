import * as React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outline' | 'flat';
  colorScheme?: 'brand' | 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  tabIndex?: number;
  ariaLabel?: string;
}

const variantStyles = {
  elevated: 'shadow-lg bg-white dark:bg-zinc-900',
  outline: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
  flat: 'bg-white dark:bg-zinc-900',
};

const colorStyles = {
  brand: '',
  primary: '',
  secondary: '',
  danger: '',
  success: '',
  warning: '',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      colorScheme = 'brand',
      as = 'section',
      children,
      className,
      tabIndex,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const Comp = as as any;
    return (
      <Comp
        ref={ref}
        className={clsx(
          'rounded-xl p-6 transition',
          variantStyles[variant],
          colorStyles[colorScheme],
          className
        )}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = 'Card'; 