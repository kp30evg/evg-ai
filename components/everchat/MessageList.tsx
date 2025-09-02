'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useChat } from './ChatProvider'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from 'lucide-react'

const colors = {
  evergreen: '#1D5238',
  charcoal: '#222B2E',
  white: '#FFFFFF',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600'
}

export default function MessageList() {
  const { messages, isTyping } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const groupMessagesByDate = (messages: typeof messages) => {
    const groups: Record<string, typeof messages> = {}
    
    messages.forEach(message => {
      const dateKey = format(message.timestamp, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {Object.entries(messageGroups).map(([date, dayMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0',
            gap: '16px'
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.lightGray + '60'
            }} />
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {formatDateHeader(new Date(date))}
            </div>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: colors.lightGray + '60'
            }} />
          </div>

          {/* Messages for this day */}
          {dayMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: message.userId === 'evergreen-ai' ? colors.evergreen : colors.lightGray,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {message.userId === 'evergreen-ai' ? (
                  <Sparkles size={16} color={colors.white} />
                ) : message.userImage ? (
                  <img 
                    src={message.userImage} 
                    alt={message.userName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.evergreen
                  }}>
                    {message.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: message.userId === 'evergreen-ai' ? colors.evergreen : colors.charcoal
                  }}>
                    {message.userName}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: colors.mediumGray
                  }}>
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                  {message.aiCommand && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      backgroundColor: colors.evergreen + '10',
                      color: colors.evergreen,
                      borderRadius: '4px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      AI Command
                    </span>
                  )}
                </div>

                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: colors.charcoal,
                  backgroundColor: message.commandResult ? colors.softGreen + '30' : 'transparent',
                  padding: message.commandResult ? '12px' : '0',
                  borderRadius: message.commandResult ? '8px' : '0',
                  border: message.commandResult ? `1px solid ${colors.evergreen}20` : 'none'
                }}>
                  {message.commandResult ? (
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => (
                          <strong style={{ color: colors.evergreen, fontWeight: 600 }}>
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ 
                            margin: '8px 0', 
                            paddingLeft: '20px',
                            listStyleType: 'disc'
                          }}>
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li style={{ marginBottom: '4px' }}>
                            {children}
                          </li>
                        )
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <span>{message.text}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ))}

      {/* Typing indicators */}
      {Object.entries(isTyping).map(([userId, typing]) => 
        typing && (
          <div key={userId} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            fontSize: '12px',
            color: colors.mediumGray,
            fontStyle: 'italic'
          }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Someone is typing...
            </motion.div>
          </div>
        )
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function formatDateHeader(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Today'
  } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return 'Yesterday'
  } else {
    return format(date, 'MMMM d, yyyy')
  }
}