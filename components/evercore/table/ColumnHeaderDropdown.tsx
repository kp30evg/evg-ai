'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Edit2, Type, Trash2, Copy, Pin } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ColumnHeaderDropdownProps {
  columnId: string
  columnLabel: string
  isCustomField?: boolean
  onRename?: (newName: string) => void
  onChangeType?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onPin?: () => void
}

export default function ColumnHeaderDropdown({
  columnId,
  columnLabel,
  isCustomField = false,
  onRename,
  onChangeType,
  onDelete,
  onDuplicate,
  onPin
}: ColumnHeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMenuItemClick = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const dropdownMenu = isOpen && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        zIndex: 9999
      }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
    >
      {/* Rename Option */}
      {isCustomField && onRename && (
        <button
          onClick={() => handleMenuItemClick(() => onRename(columnLabel))}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
        >
          <Edit2 className="h-4 w-4 text-gray-400" />
          <span>Rename</span>
        </button>
      )}

      {/* Change Column Type Option */}
      {isCustomField && onChangeType && (
        <button
          onClick={() => handleMenuItemClick(() => onChangeType())}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
        >
          <Type className="h-4 w-4 text-gray-400" />
          <span>Change column type</span>
        </button>
      )}

      {/* Duplicate Option */}
      {onDuplicate && (
        <button
          onClick={() => handleMenuItemClick(() => onDuplicate())}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
        >
          <Copy className="h-4 w-4 text-gray-400" />
          <span>Duplicate</span>
        </button>
      )}

      {/* Pin Option */}
      {onPin && (
        <button
          onClick={() => handleMenuItemClick(() => onPin())}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
        >
          <Pin className="h-4 w-4 text-gray-400" />
          <span>Pin column</span>
        </button>
      )}

      {/* Divider */}
      {isCustomField && onDelete && (
        <>
          <div className="h-px bg-gray-200 my-1" />
          
          {/* Delete Option */}
          <button
            onClick={() => handleMenuItemClick(() => onDelete())}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  )

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          isOpen ? 'bg-gray-100' : ''
        }`}
        aria-label={`Column options for ${columnLabel}`}
      >
        <ChevronDown className="h-3 w-3 text-gray-500" />
      </button>
      
      {/* Portal for dropdown menu */}
      {typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </>
  )
}