import * as React from 'react';
import { Card } from '../../primitives';
import type { DashboardWidget } from '../types/widget';

interface WidgetContainerProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onFocusNext?: () => void;
  onFocusPrev?: () => void;
}

export function WidgetContainer({
  widget,
  children,
  className,
  style,
  onFocusNext,
  onFocusPrev,
}: WidgetContainerProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  // Handle keyboard interactions for drag and resize
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow keys for navigation between widgets
    if (e.key === 'ArrowRight' && onFocusNext) {
      e.preventDefault();
      onFocusNext();
    } else if (e.key === 'ArrowLeft' && onFocusPrev) {
      e.preventDefault();
      onFocusPrev();
    }

    // Space/Enter to toggle drag mode
    if ((e.key === ' ' || e.key === 'Enter') && e.target === e.currentTarget) {
      e.preventDefault();
      setIsDragging(!isDragging);
    }

    // Escape to exit drag/resize mode
    if (e.key === 'Escape') {
      setIsDragging(false);
      setIsResizing(false);
    }
  };

  return (
    <Card
      as="section"
      variant="outline"
      tabIndex={0}
      aria-label={widget.title}
      aria-roledescription="dashboard widget"
      aria-describedby={`desc-${widget.id}`}
      aria-grabbed={isDragging}
      aria-expanded={isResizing}
      role="region"
      className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg transition-shadow ${className || ''}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Drag handle with improved keyboard support */}
      <div 
        role="button"
        tabIndex={0}
        className="flex items-center mb-2 cursor-move select-none text-xs uppercase tracking-wider text-zinc-400 focus-within:text-blue-600 hover:text-blue-600 transition-colors"
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsDragging(!isDragging);
          }
        }}
        aria-label={`Drag ${widget.title} widget. Press Space or Enter to start dragging`}
        aria-pressed={isDragging}
      >
        <span className="mr-2" aria-hidden="true">≡</span>
        <span className="font-semibold flex-1">{widget.title}</span>
        {isDragging && (
          <span className="sr-only">
            Use arrow keys to move. Press Space or Enter to drop. Press Escape to cancel.
          </span>
        )}
      </div>

      {/* Main content area */}
      <div 
        className="flex-1 flex flex-col justify-center" 
        id={`desc-${widget.id}`}
        role="group"
        aria-label={`${widget.title} content`}
      >
        {children}
      </div>

      {/* Resize handle with improved keyboard support */}
      <div 
        role="button"
        tabIndex={0}
        className="mt-2 flex justify-end"
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsResizing(!isResizing);
          }
        }}
        aria-label={`Resize ${widget.title} widget. Press Space or Enter to start resizing`}
        aria-pressed={isResizing}
      >
        <span 
          className="cursor-se-resize text-zinc-300 text-lg focus-within:text-blue-600 hover:text-blue-600 transition-colors p-1" 
          aria-hidden="true"
        >
          ◢
        </span>
        {isResizing && (
          <span className="sr-only">
            Use arrow keys to resize. Press Space or Enter to confirm. Press Escape to cancel.
          </span>
        )}
      </div>
    </Card>
  );
}
