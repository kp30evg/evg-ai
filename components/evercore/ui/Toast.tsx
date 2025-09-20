'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const toastStyles = {
  success: {
    icon: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    title: 'text-green-900',
    message: 'text-green-700',
    action: 'text-green-700 hover:text-green-800 hover:bg-green-100'
  },
  error: {
    icon: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    title: 'text-red-900',
    message: 'text-red-700',
    action: 'text-red-700 hover:text-red-800 hover:bg-red-100'
  },
  warning: {
    icon: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    title: 'text-amber-900',
    message: 'text-amber-700',
    action: 'text-amber-700 hover:text-amber-800 hover:bg-amber-100'
  },
  info: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    title: 'text-blue-900',
    message: 'text-blue-700',
    action: 'text-blue-700 hover:text-blue-800 hover:bg-blue-100'
  }
}

export function Toast({ id, type, title, message, duration = 5000, action, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  const Icon = toastIcons[type]
  const styles = toastStyles[type]

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, 300) // Match animation duration
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-white
        transform transition-all duration-300 ease-out
        ${styles.bg}
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      
      <div className="flex-1">
        <p className={`text-sm font-medium ${styles.title}`}>
          {title}
        </p>
        {message && (
          <p className={`mt-1 text-sm ${styles.message}`}>
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick()
              handleClose()
            }}
            className={`mt-2 text-sm font-medium px-2 py-1 rounded transition-colors ${styles.action}`}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100/50 transition-colors"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>
    </div>
  )
}

// Toast Container Component
export function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const container = (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )

  return createPortal(container, document.body)
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId) => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId))
      }
    }
    setToasts((prev) => [...prev, newToast])
    return id
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toasts,
    showToast,
    removeToast,
    success: (title: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'title' | 'onClose'>>) => 
      showToast({ type: 'success', title, ...options }),
    error: (title: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'title' | 'onClose'>>) => 
      showToast({ type: 'error', title, ...options }),
    warning: (title: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'title' | 'onClose'>>) => 
      showToast({ type: 'warning', title, ...options }),
    info: (title: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'title' | 'onClose'>>) => 
      showToast({ type: 'info', title, ...options }),
  }
}