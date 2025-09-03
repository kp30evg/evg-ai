'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Minimize2, Users, Hash, Send, Search, ChevronDown, Maximize2 } from 'lucide-react'
import { useUser, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ConversationList from './ConversationList'
import { ChatProvider, useChat } from './ChatProvider'

// Brand colors from style guide
const colors = {
  evergreen: '#1D5238',
  charcoal: '#222B2E',
  white: '#FFFFFF',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600'
}

export default function ChatWidget() {
  return (
    <ChatProvider>
      <ChatWidgetContent />
    </ChatProvider>
  )
}

function ChatWidgetContent() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [view, setView] = useState<'conversations' | 'chat'>('conversations')
  const [unreadCount, setUnreadCount] = useState(3) // Will be dynamic
  const { user } = useUser()
  const { organization } = useOrganization()
  const { selectedConversation, setSelectedConversation } = useChat()
  const router = useRouter()

  // Widget positioning - bottom right like LinkedIn/Facebook
  const widgetPosition = {
    bottom: '24px',
    right: '24px'
  }

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation)
    setView('chat')
  }

  const handleBack = () => {
    setView('conversations')
    setSelectedConversation(null)
  }

  return (
    <>
      {/* Floating button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              ...widgetPosition,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: colors.evergreen,
              color: colors.white,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(29, 82, 56, 0.25)',
              zIndex: 9999
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare size={28} />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: colors.gold,
                  color: colors.charcoal,
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${colors.white}`
                }}
              >
                {unreadCount}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              ...widgetPosition,
              width: '380px',
              backgroundColor: colors.white,
              borderRadius: '16px',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 9999,
              border: `1px solid ${colors.lightGray}40`
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: colors.white,
              borderBottom: `1px solid ${colors.lightGray}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '60px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {view === 'chat' && selectedConversation && (
                  <button
                    onClick={handleBack}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '8px',
                      transition: 'all 200ms ease-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.softGreen
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <ChevronDown size={20} color={colors.charcoal} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                )}
                
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    letterSpacing: '-0.01em'
                  }}>
                    {view === 'conversations' ? 'Team Chat' : (selectedConversation?.name || 'Chat')}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.mediumGray
                  }}>
                    {organization?.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => {
                    router.push('/chat')
                    setIsOpen(false)
                  }}
                  title="Open in full page"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
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
                  <Maximize2 size={18} color={colors.mediumGray} />
                </button>

                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
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
                  <Minimize2 size={18} color={colors.mediumGray} />
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
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
                  <X size={18} color={colors.mediumGray} />
                </button>
              </div>
            </div>

            {/* Content area */}
            {!isMinimized && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {view === 'conversations' ? (
                  <ConversationList onSelectConversation={handleSelectConversation} />
                ) : (
                  <>
                    <MessageList />
                    <MessageInput />
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}