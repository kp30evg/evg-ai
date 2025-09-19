'use client'

import React, { forwardRef, useState } from 'react'
import { theme } from '@/lib/evercore/theme'
import { AlertCircle, Check, X } from 'lucide-react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    success,
    helperText,
    required,
    fullWidth = false,
    size = 'md',
    className,
    style,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const getSizeStyles = () => {
      switch (size) {
        case 'sm':
          return {
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            fontSize: theme.typography.fontSize.sm,
          }
        case 'lg':
          return {
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            fontSize: theme.typography.fontSize.base,
          }
        default:
          return {
            padding: `${theme.spacing.md} ${theme.spacing.md}`,
            fontSize: theme.typography.fontSize.sm,
          }
      }
    }

    const getBorderColor = () => {
      if (error) return theme.colors.error
      if (success) return theme.colors.success
      if (isFocused) return theme.colors.evergreen
      return theme.colors.lightGray
    }

    const getBoxShadow = () => {
      if (!isFocused) return 'none'
      if (error) return `0 0 0 3px ${theme.colors.error}15`
      if (success) return `0 0 0 3px ${theme.colors.success}15`
      return `0 0 0 3px ${theme.colors.evergreen}15`
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div style={{
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}>
        {/* Label */}
        {label && (
          <label style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.charcoal,
          }}>
            {label}
            {required && (
              <span style={{
                color: theme.colors.error,
                marginLeft: '4px',
              }}>
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              width: '100%',
              ...getSizeStyles(),
              border: `2px solid ${getBorderColor()}`,
              borderRadius: theme.borderRadius.base,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              fontFamily: theme.typography.fontFamily,
              outline: 'none',
              transition: theme.transitions.fast,
              boxShadow: getBoxShadow(),
              paddingRight: (error || success) ? '40px' : undefined,
              ...props.style,
            }}
            className={className}
            {...props}
          />

          {/* Status Icon */}
          {(error || success) && (
            <div style={{
              position: 'absolute',
              right: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}>
              {error && (
                <AlertCircle size={18} style={{ color: theme.colors.error }} />
              )}
              {success && !error && (
                <Check size={18} style={{ color: theme.colors.success }} />
              )}
            </div>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <div style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.xs,
            color: error ? theme.colors.error : theme.colors.mediumGray,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
          }}>
            {error || helperText}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input