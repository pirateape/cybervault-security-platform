import * as React from 'react';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  initialFocusRef,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  // Focus trap
  React.useEffect(() => {
    if (isOpen && dialogRef.current) {
      const previouslyFocused = document.activeElement as HTMLElement;
      const focusTarget = initialFocusRef?.current || dialogRef.current;
      focusTarget.focus();
      return () => {
        previouslyFocused?.focus();
      };
    }
  }, [isOpen, initialFocusRef]);

  // Close on ESC
  React.useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent background scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity',
        className
      )}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onClick={closeOnOverlayClick ? (e) => { if (e.target === overlayRef.current) onClose(); } : undefined}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full p-6 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        tabIndex={0}
      >
        {title && (
          <h2 id={ariaLabelledBy} className="text-xl font-bold mb-4">{title}</h2>
        )}
        {children}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
    </div>
  );
}; 