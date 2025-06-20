import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from '@radix-ui/react-dialog';
import { Card } from '../../../../../libs/ui/primitives';

interface FormErrorProps {
  error?: string | null;
  id?: string;
}
/**
 * Accessible error feedback for forms. Accepts optional id for aria-describedby.
 */
export function FormError({ error, id }: FormErrorProps) {
  if (!error) return null;
  return (
    <Card className="mt-2" role="alert" id={id} colorScheme="danger">
      <span>{error}</span>
    </Card>
  );
}

// Shared loading skeleton
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card
      className={className}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </Card>
  );
}

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
/**
 * Primary action button with optional loading spinner.
 */
export function PrimaryButton({ loading, children, disabled, ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      className={`btn btn-primary ${rest.className || ''}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <span className="loading loading-spinner mr-2" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

// Shared secondary/ghost button
export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="btn btn-ghost" {...props}>
      {children}
    </button>
  );
}

// Shared modal dialog using Radix UI
export function ModalDialog({
  open,
  onOpenChange,
  title,
  children,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogTitle>{title}</DialogTitle>
        {children}
        <DialogClose asChild>
          <button className="btn btn-ghost mt-2" onClick={onClose}>Close</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
// All components are accessible, modular, and extensible for best-practice UI/UX. 