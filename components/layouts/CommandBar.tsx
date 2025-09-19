'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Command,
  Send,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface CommandBarProps {
  onExecute?: (command: string) => void
  isProcessing?: boolean
  placeholder?: string
}

export default function CommandBar({ 
  onExecute, 
  isProcessing = false,
  placeholder = "Type a command or search..."
}: CommandBarProps) {
  const [command, setCommand] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Example command suggestions
  const commandSuggestions = [
    "Show me contacts with high deal potential",
    "Create a new deal for Acme Corp",
    "What's my pipeline value this quarter?",
    "Schedule a meeting with John Doe",
    "Send an email to all prospects",
  ]

  useEffect(() => {
    if (command.length > 2) {
      const filtered = commandSuggestions.filter(s => 
        s.toLowerCase().includes(command.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 3))
    } else {
      setSuggestions([])
    }
  }, [command])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim() && !isProcessing) {
      onExecute?.(command)
      setCommand('')
      setSuggestions([])
      setIsExpanded(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    // Toggle expanded mode with Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      height: theme.layout.commandBarHeight,
      backgroundColor: theme.colors.white,
      borderBottom: `1px solid ${theme.colors.lightGray}`,
      zIndex: theme.zIndex.sticky,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${theme.spacing.xl}`,
    }}>
      <div style={{
        flex: 1,
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
      }}>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            {/* Command Icon */}
            <div style={{
              position: 'absolute',
              left: '16px',
              display: 'flex',
              alignItems: 'center',
              color: theme.colors.mediumGray,
              zIndex: 1,
            }}>
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 size={18} />
                </motion.div>
              ) : (
                <Command size={18} />
              )}
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={placeholder}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '12px 120px 12px 48px',
                border: `2px solid ${isFocused ? theme.colors.evergreen : theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: theme.typography.fontFamily,
                backgroundColor: theme.colors.white,
                color: theme.colors.charcoal,
                outline: 'none',
                transition: theme.transitions.fast,
                boxShadow: isFocused ? `0 0 0 3px ${theme.colors.evergreen}15` : 'none',
              }}
            />

            {/* Action Buttons */}
            <div style={{
              position: 'absolute',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 1,
            }}>
              {command && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  type="button"
                  onClick={() => setCommand('')}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.mediumGray,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.lightGray
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X size={16} />
                </motion.button>
              )}
              
              <motion.button
                type="submit"
                disabled={!command.trim() || isProcessing}
                whileHover={{ scale: command.trim() && !isProcessing ? 1.05 : 1 }}
                whileTap={{ scale: command.trim() && !isProcessing ? 0.95 : 1 }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: command.trim() && !isProcessing 
                    ? theme.colors.evergreen 
                    : theme.colors.lightGray,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  color: command.trim() && !isProcessing 
                    ? theme.colors.white 
                    : theme.colors.mediumGray,
                  cursor: command.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  transition: theme.transitions.fast,
                }}
              >
                <Sparkles size={16} />
                Execute
              </motion.button>
            </div>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                boxShadow: theme.shadows.lg,
                overflow: 'hidden',
                zIndex: theme.zIndex.dropdown,
              }}
            >
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setCommand(suggestion)
                    setSuggestions([])
                    inputRef.current?.focus()
                  }}
                  style={{
                    padding: '12px 16px',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.charcoal,
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 
                      ? `1px solid ${theme.colors.lightGray}` 
                      : 'none',
                    transition: theme.transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.softGreen
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={14} style={{ color: theme.colors.mediumGray }} />
                    <span>{suggestion}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcut Hint */}
      {!isFocused && (
        <div style={{
          position: 'absolute',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: theme.colors.mediumGray,
          fontSize: theme.typography.fontSize.xs,
        }}>
          <kbd style={{
            padding: '2px 6px',
            backgroundColor: theme.colors.lightGray,
            borderRadius: theme.borderRadius.sm,
            fontFamily: theme.typography.fontFamilyMono,
            fontSize: '11px',
          }}>
            ⌘K
          </kbd>
          <span>to focus</span>
        </div>
      )}
    </div>
  )
}