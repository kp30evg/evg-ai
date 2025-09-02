'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, AtSign, Hash, Smile } from 'lucide-react'
import { useChat } from './ChatProvider'

const colors = {
  evergreen: '#1D5238',
  charcoal: '#222B2E',
  white: '#FFFFFF',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600'
}

export default function MessageInput() {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showCommandHint, setShowCommandHint] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, selectedConversation } = useChat()

  const handleSend = async () => {
    if (!message.trim()) return
    
    await sendMessage(message)
    setMessage('')
    setShowCommandHint(false)
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (value: string) => {
    setMessage(value)
    
    // Show command hint when typing @evergreen
    if (value.startsWith('@evergreen') || value.startsWith('@')) {
      setShowCommandHint(true)
    } else {
      setShowCommandHint(false)
    }

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }

  const commandSuggestions = [
    'summarize this conversation',
    'create task from last message',
    'schedule meeting with everyone here',
    'analyze our sales discussion',
    'what did we decide about pricing?'
  ]

  return (
    <div style={{
      borderTop: `1px solid ${colors.lightGray}40`,
      padding: '16px',
      backgroundColor: colors.white
    }}>
      {/* Command hints */}
      {showCommandHint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: colors.softGreen + '50',
            borderRadius: '8px',
            border: `1px solid ${colors.evergreen}20`
          }}
        >
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: colors.evergreen,
            marginBottom: '8px'
          }}>
            AI Commands Available
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {commandSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setMessage(`@evergreen ${suggestion}`)
                  setShowCommandHint(false)
                  inputRef.current?.focus()
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.evergreen}30`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: colors.evergreen,
                  cursor: 'pointer',
                  transition: 'all 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.evergreen
                  e.currentTarget.style.color = colors.white
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.white
                  e.currentTarget.style.color = colors.evergreen
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input area */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        backgroundColor: isFocused ? colors.white : '#F9FAFB',
        border: `1px solid ${isFocused ? colors.evergreen : colors.lightGray}60`,
        borderRadius: '12px',
        padding: '8px 12px',
        transition: 'all 200ms ease-out'
      }}>
        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '4px'
        }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Paperclip size={16} color={colors.mediumGray} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setMessage('@evergreen ')
              inputRef.current?.focus()
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <AtSign size={16} color={colors.mediumGray} />
          </motion.button>
        </div>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Message ${selectedConversation?.name || 'chat'}...`}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            color: colors.charcoal,
            backgroundColor: 'transparent',
            minHeight: '24px',
            maxHeight: '120px',
            fontFamily: 'inherit'
          }}
          rows={1}
        />

        {/* Send button */}
        <motion.button
          whileHover={message.trim() ? { scale: 1.05 } : {}}
          whileTap={message.trim() ? { scale: 0.95 } : {}}
          onClick={handleSend}
          disabled={!message.trim()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: message.trim() ? colors.evergreen : colors.lightGray,
            border: 'none',
            cursor: message.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2px',
            transition: 'all 200ms ease-out'
          }}
        >
          <Send size={16} color={colors.white} />
        </motion.button>
      </div>

      {/* Typing hint */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: colors.mediumGray,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span>Press Enter to send</span>
        <span>•</span>
        <span>Type @evergreen for AI commands</span>
      </div>
    </div>
  )
}