'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const chipVariants = cva(
  'inline-flex items-center justify-center rounded-full text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        primary: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
        success: 'bg-green-50 text-green-700 hover:bg-green-100',
        warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
        danger: 'bg-red-50 text-red-700 hover:bg-red-100',
        purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
        // Status variants
        cold: 'bg-sky-50 text-sky-700',
        warm: 'bg-amber-50 text-amber-700',
        hot: 'bg-orange-50 text-orange-700',
        won: 'bg-emerald-50 text-emerald-700',
        lost: 'bg-gray-50 text-gray-600',
        // Priority variants
        critical: 'bg-red-100 text-red-800 font-semibold',
        high: 'bg-orange-100 text-orange-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800',
        // Deal stages
        qualified: 'bg-blue-100 text-blue-800',
        proposal: 'bg-purple-100 text-purple-800',
        negotiation: 'bg-indigo-100 text-indigo-800',
        closed: 'bg-emerald-100 text-emerald-800'
      },
      size: {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base'
      },
      clickable: {
        true: 'cursor-pointer hover:scale-105',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
      clickable: false
    }
  }
)

export interface ChipProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  onRemove?: () => void
  icon?: React.ReactNode
  avatar?: string | React.ReactNode
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, size, clickable, onRemove, icon, avatar, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant, size, clickable }), className)}
        {...props}
      >
        {avatar && (
          <span className="mr-1 -ml-0.5">
            {typeof avatar === 'string' ? (
              <img src={avatar} alt="" className="w-4 h-4 rounded-full" />
            ) : (
              avatar
            )}
          </span>
        )}
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 -mr-0.5 rounded-full hover:bg-black/10 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
)
Chip.displayName = 'Chip'

export { Chip, chipVariants }