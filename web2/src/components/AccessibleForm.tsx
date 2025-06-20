'use client'

import React, { useId, useState, useRef, useEffect } from 'react'
import { formA11y, LiveAnnouncer } from '../lib/accessibility'

interface AccessibleFormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  submitText?: string
  resetText?: string
  disabled?: boolean
}

interface AccessibleFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  value?: string
  options?: { value: string; label: string }[]
  validation?: (value: string) => string | null
  helpText?: string
  className?: string
  children?: React.ReactNode
}

interface FormContextType {
  errors: Record<string, string>
  values: Record<string, any>
  touched: Record<string, boolean>
  setFieldValue: (name: string, value: any) => void
  setFieldError: (name: string, error: string | null) => void
  setFieldTouched: (name: string, touched: boolean) => void
  validateField: (name: string) => void
}

const FormContext = React.createContext<FormContextType | null>(null)

export function AccessibleForm({
  onSubmit,
  children,
  className = '',
  title,
  description,
  submitText = 'Submit',
  resetText = 'Reset',
  disabled = false
}: AccessibleFormProps) {
  const formId = useId()
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const announcer = LiveAnnouncer.getInstance()

  const setFieldValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const setFieldError = (name: string, error: string | null) => {
    setErrors(prev => {
      if (error === null) {
        const { [name]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [name]: error }
    })
  }

  const setFieldTouched = (name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }))
  }

  const validateField = (name: string) => {
    // Validation logic would be implemented by individual fields
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (disabled || isSubmitting) return

    // Mark all fields as touched
    const allFields = Object.keys(values)
    const newTouched = allFields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {})
    setTouched(newTouched)

    // Check for errors
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) {
      const errorCount = Object.keys(errors).length
      announcer.announce(
        `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct.`,
        'assertive'
      )
      
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
      if (errorElement) {
        errorElement.focus()
      }
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
      announcer.announce('Form submitted successfully', 'assertive')
    } catch (error) {
      announcer.announce('Form submission failed. Please try again.', 'assertive')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setValues({})
    setErrors({})
    setTouched({})
    announcer.announce('Form has been reset', 'polite')
  }

  const contextValue: FormContextType = {
    errors,
    values,
    touched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField
  }

  return (
    <FormContext.Provider value={contextValue}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onReset={handleReset}
        className={`accessible-form ${className}`}
        aria-labelledby={title ? `${formId}-title` : undefined}
        aria-describedby={description ? `${formId}-description` : undefined}
        noValidate
      >
        {title && (
          <h2 id={`${formId}-title`} className="form-title">
            {title}
          </h2>
        )}
        
        {description && (
          <p id={`${formId}-description`} className="form-description">
            {description}
          </p>
        )}

        <div className="form-fields">
          {children}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="btn btn-primary"
            aria-describedby={Object.keys(errors).length > 0 ? `${formId}-errors` : undefined}
          >
            {isSubmitting ? (
              <>
                <span className="loading-spinner loading-spinner-sm" aria-hidden="true"></span>
                <span className="sr-only">Submitting...</span>
                Submitting...
              </>
            ) : (
              submitText
            )}
          </button>
          
          <button
            type="reset"
            disabled={disabled || isSubmitting}
            className="btn btn-secondary"
          >
            {resetText}
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div
            id={`${formId}-errors`}
            className="form-error-summary"
            role="alert"
            aria-live="assertive"
          >
            <h3>Please correct the following errors:</h3>
            <ul>
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>
                  <a href={`#${field}`} onClick={(e) => {
                    e.preventDefault()
                    const element = formRef.current?.querySelector(`[name="${field}"]`) as HTMLElement
                    if (element) element.focus()
                  }}>
                    {error}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </FormContext.Provider>
  )
}

export function AccessibleField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  value,
  options = [],
  validation,
  helpText,
  className = '',
  children
}: AccessibleFieldProps) {
  const fieldId = useId()
  const context = React.useContext(FormContext)
  
  if (!context) {
    throw new Error('AccessibleField must be used within AccessibleForm')
  }

  const { errors, values, touched, setFieldValue, setFieldError, setFieldTouched } = context
  const fieldValue = values[name] || value || ''
  const fieldError = errors[name]
  const fieldTouched = touched[name]
  const hasError = fieldError && fieldTouched

  const handleChange = (newValue: any) => {
    setFieldValue(name, newValue)
    
    // Run validation if provided
    if (validation) {
      const error = validation(newValue)
      setFieldError(name, error)
    }
  }

  const handleBlur = () => {
    setFieldTouched(name, true)
    
    // Run validation on blur
    if (validation && !fieldTouched) {
      const error = validation(fieldValue)
      setFieldError(name, error)
    }
  }

  const baseFieldProps = formA11y.createFieldProps(fieldId, label, required, hasError ? fieldError : undefined)
  const fieldProps = {
    ...baseFieldProps,
    'aria-invalid': hasError ? ('true' as const) : ('false' as const),
    name,
    value: fieldValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      handleChange(e.target.value)
    },
    onBlur: handleBlur,
    className: `form-control ${hasError ? 'form-field-error' : ''} ${className}`,
    placeholder
  }

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return <textarea {...fieldProps} rows={4} />
      
      case 'select':
        return (
          <select {...fieldProps}>
            <option value="">Select an option</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'checkbox':
        return (
          <input
            {...fieldProps}
            type="checkbox"
            checked={fieldValue}
            onChange={(e) => handleChange(e.target.checked)}
            className={`form-checkbox ${hasError ? 'form-field-error' : ''} ${className}`}
          />
        )
      
      case 'radio':
        return (
          <div role="radiogroup" aria-labelledby={`${fieldId}-label`}>
            {options.map(option => (
              <label key={option.value} className="form-radio-label">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  className={`form-radio ${hasError ? 'form-field-error' : ''}`}
                  aria-describedby={hasError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )
      
      default:
        return <input {...fieldProps} type={type} />
    }
  }

  return (
    <div className={`form-field ${hasError ? 'has-error' : ''}`}>
      <label 
        {...formA11y.createLabelProps(fieldId)}
        id={`${fieldId}-label`}
        className="form-label"
      >
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      
      {renderField()}
      
      {helpText && (
        <div id={`${fieldId}-help`} className="form-help-text">
          {helpText}
        </div>
      )}
      
              {hasError && (
          <div 
            {...formA11y.createErrorProps(fieldId)}
            className="form-error-message"
            aria-live={"assertive" as const}
          >
            {fieldError}
          </div>
        )}
      
      {children}
    </div>
  )
}

export { FormContext } 