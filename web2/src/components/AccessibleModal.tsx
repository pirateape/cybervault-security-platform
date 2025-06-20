'use client'

import React, { useId, useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FocusManager, handleKeyboardActivation, KeyCodes, useFocusRestore } from '../lib/accessibility'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  initialFocusRef?: React.RefObject<HTMLElement>
  finalFocusRef?: React.RefObject<HTMLElement>
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  initialFocusRef,
  finalFocusRef
}: AccessibleModalProps) {
  const modalId = useId()
  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  // Restore focus when modal closes
  useFocusRestore()

  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    // Focus initial element or first focusable element
    const focusElement = initialFocusRef?.current || FocusManager.getFirstFocusableElement(modal)
    if (focusElement) {
      focusElement.focus()
    }

    // Handle keyboard navigation and escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === KeyCodes.ESCAPE) {
        e.preventDefault()
        onClose()
        return
      }

      // Trap focus within modal
      FocusManager.trapFocus(modal, e)
    }

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, closeOnEscape, onClose, initialFocusRef])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    handleKeyboardActivation(e, () => {
      if (closeOnOverlayClick) {
        onClose()
      }
    })
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={`modal-content modal-${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        aria-describedby={description ? `${modalId}-description` : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={`${modalId}-title`} className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {description && (
          <div id={`${modalId}-description`} className="modal-description sr-only">
            {description}
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )

  // Render modal in portal to body
  return createPortal(modalContent, document.body)
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocusRef={variant === 'danger' ? cancelButtonRef : confirmButtonRef}
      className={`confirm-modal confirm-modal-${variant}`}
    >
      <div className="confirm-modal-content">
        <p className="confirm-modal-message">{message}</p>
        
        <div className="confirm-modal-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  )
}

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  buttonText?: string
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'OK'
}: AlertModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocusRef={buttonRef}
      className={`alert-modal alert-modal-${variant}`}
    >
      <div className="alert-modal-content">
        <div className={`alert-modal-icon alert-modal-icon-${variant}`} aria-hidden="true">
          {variant === 'success' && '✓'}
          {variant === 'error' && '✕'}
          {variant === 'warning' && '⚠'}
          {variant === 'info' && 'ℹ'}
        </div>
        
        <p className="alert-modal-message">{message}</p>
        
        <div className="alert-modal-actions">
          <button
            ref={buttonRef}
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  )
} 