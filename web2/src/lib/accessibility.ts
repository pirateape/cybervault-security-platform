// Accessibility utilities for WCAG 2.1 AA compliance

/**
 * Keyboard event utilities
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

/**
 * Handle keyboard activation (Enter or Space)
 */
export const handleKeyboardActivation = (
  event: React.KeyboardEvent,
  callback: () => void
) => {
  if (event.key === KeyCodes.ENTER || event.key === KeyCodes.SPACE) {
    event.preventDefault()
    callback()
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
  }

  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[0] || null
  }

  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const elements = this.getFocusableElements(container)
    return elements[elements.length - 1] || null
  }

  static trapFocus(container: HTMLElement, event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.key === KeyCodes.TAB) {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }
}

/**
 * ARIA live region announcer
 */
export class LiveAnnouncer {
  private static instance: LiveAnnouncer
  private liveRegion: HTMLElement | null = null

  static getInstance(): LiveAnnouncer {
    if (!LiveAnnouncer.instance) {
      LiveAnnouncer.instance = new LiveAnnouncer()
    }
    return LiveAnnouncer.instance
  }

  private constructor() {
    this.createLiveRegion()
  }

  private createLiveRegion() {
    if (typeof document === 'undefined') return

    this.liveRegion = document.createElement('div')
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.style.position = 'absolute'
    this.liveRegion.style.left = '-10000px'
    this.liveRegion.style.width = '1px'
    this.liveRegion.style.height = '1px'
    this.liveRegion.style.overflow = 'hidden'
    document.body.appendChild(this.liveRegion)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return

    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message

    // Clear the message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = ''
      }
    }, 1000)
  }
}

/**
 * Skip link utilities
 */
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => ({
  href: `#${targetId}`,
  className: 'skip-link',
  children: text,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === KeyCodes.ENTER) {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }
})

/**
 * ARIA attribute helpers
 */
export const createAriaProps = {
  button: (label: string, expanded?: boolean, controls?: string) => ({
    'aria-label': label,
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    ...(controls && { 'aria-controls': controls })
  }),

  menu: (label: string) => ({
    role: 'menu',
    'aria-label': label
  }),

  menuItem: (current?: boolean) => ({
    role: 'menuitem',
    ...(current && { 'aria-current': 'page' as const })
  }),

  table: (label: string, describedBy?: string) => ({
    'aria-label': label,
    ...(describedBy && { 'aria-describedby': describedBy })
  }),

  dialog: (labelledBy: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': labelledBy,
    ...(describedBy && { 'aria-describedby': describedBy })
  }),

  alert: (live: boolean = true) => ({
    role: 'alert',
    ...(live && { 'aria-live': 'assertive' })
  }),

  status: () => ({
    role: 'status',
    'aria-live': 'polite'
  })
}

/**
 * Color contrast utilities
 */
export const colorContrast = {
  // WCAG AA minimum contrast ratios
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  
  // High contrast color pairs for accessibility
  pairs: {
    primary: {
      background: 'rgb(33, 128, 141)',
      text: 'rgb(255, 255, 255)',
      ratio: 5.2
    },
    error: {
      background: 'rgb(192, 21, 47)',
      text: 'rgb(255, 255, 255)',
      ratio: 6.8
    },
    success: {
      background: 'rgb(33, 128, 141)',
      text: 'rgb(255, 255, 255)',
      ratio: 5.2
    },
    warning: {
      background: 'rgb(168, 75, 47)',
      text: 'rgb(255, 255, 255)',
      ratio: 4.6
    }
  }
}

/**
 * Form accessibility helpers
 */
export const formA11y = {
  createFieldProps: (id: string, label: string, required: boolean = false, error?: string) => ({
    id,
    'aria-label': label,
    'aria-required': required,
    ...(error && { 'aria-describedby': `${id}-error`, 'aria-invalid': 'true' })
  }),

  createErrorProps: (fieldId: string) => ({
    id: `${fieldId}-error`,
    role: 'alert',
    'aria-live': 'polite'
  }),

  createLabelProps: (fieldId: string) => ({
    htmlFor: fieldId
  })
}

/**
 * Navigation accessibility helpers
 */
export const navigationA11y = {
  handleMenuKeyNavigation: (
    event: React.KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onNavigate: (index: number) => void,
    onActivate: () => void
  ) => {
    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
        event.preventDefault()
        onNavigate((currentIndex + 1) % itemCount)
        break
      case KeyCodes.ARROW_UP:
        event.preventDefault()
        onNavigate(currentIndex === 0 ? itemCount - 1 : currentIndex - 1)
        break
      case KeyCodes.HOME:
        event.preventDefault()
        onNavigate(0)
        break
      case KeyCodes.END:
        event.preventDefault()
        onNavigate(itemCount - 1)
        break
      case KeyCodes.ENTER:
      case KeyCodes.SPACE:
        event.preventDefault()
        onActivate()
        break
    }
  }
}

/**
 * Custom hook for managing focus restoration
 */
export const useFocusRestore = () => {
  const previousFocus = React.useRef<HTMLElement | null>(null)

  const saveFocus = () => {
    previousFocus.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocus.current) {
      previousFocus.current.focus()
      previousFocus.current = null
    }
  }

  return { saveFocus, restoreFocus }
}

import React from 'react' 