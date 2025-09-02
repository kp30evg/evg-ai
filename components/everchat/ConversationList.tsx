'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Users, Search, Plus, X, MessageSquare } from 'lucide-react'
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

interface ConversationListProps {
  onSelectConversation: (conversation: any) => void
}

export default function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { conversations, organizationMembers, createDMConversation } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'channels' | 'dms'>('channels')
  const [showMemberSelector, setShowMemberSelector] = useState(false)

  const channels = conversations.filter(c => c.type === 'channel')
  const dms = conversations.filter(c => c.type === 'dm')

  const filteredConversations = activeTab === 'channels' ? channels : dms

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: colors.white
    }}>
      {/* Search bar */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{
          position: 'relative'
        }}>
          <Search size={16} color={colors.mediumGray} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#F9FAFB',
              border: `1px solid ${colors.lightGray}60`,
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 200ms ease-out'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.evergreen
              e.target.style.backgroundColor = colors.white
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${colors.lightGray}60`
              e.target.style.backgroundColor = '#F9FAFB'
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '0 16px',
        gap: '4px',
        borderBottom: `1px solid ${colors.lightGray}40`
      }}>
        <button
          onClick={() => setActiveTab('channels')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'channels' ? `2px solid ${colors.evergreen}` : '2px solid transparent',
            fontSize: '13px',
            fontWeight: activeTab === 'channels' ? '600' : '500',
            color: activeTab === 'channels' ? colors.evergreen : colors.mediumGray,
            cursor: 'pointer',
            transition: 'all 200ms ease-out'
          }}
        >
          Channels
        </button>
        <button
          onClick={() => setActiveTab('dms')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dms' ? `2px solid ${colors.evergreen}` : '2px solid transparent',
            fontSize: '13px',
            fontWeight: activeTab === 'dms' ? '600' : '500',
            color: activeTab === 'dms' ? colors.evergreen : colors.mediumGray,
            cursor: 'pointer',
            transition: 'all 200ms ease-out'
          }}
        >
          Direct Messages
        </button>
      </div>

      {/* Conversation list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        position: 'relative'
      }}>
        {/* New conversation button */}
        <button
          onClick={() => {
            if (activeTab === 'dms') {
              setShowMemberSelector(true)
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '4px',
            backgroundColor: 'transparent',
            border: `1px dashed ${colors.lightGray}`,
            borderRadius: '8px',
            fontSize: '13px',
            color: colors.mediumGray,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 200ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.evergreen
            e.currentTarget.style.backgroundColor = colors.softGreen
            e.currentTarget.style.color = colors.evergreen
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.lightGray
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = colors.mediumGray
          }}
        >
          <Plus size={16} />
          {activeTab === 'channels' ? 'Create Channel' : 'New Message'}
        </button>

        {/* Member selector overlay */}
        <AnimatePresence>
          {showMemberSelector && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                top: '48px',
                left: '8px',
                right: '8px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                zIndex: 100,
                maxHeight: '300px',
                overflow: 'hidden'
              }}
            >
              <div style={{
                padding: '12px',
                borderBottom: `1px solid ${colors.lightGray}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  Select team member
                </span>
                <button
                  onClick={() => setShowMemberSelector(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} color={colors.mediumGray} />
                </button>
              </div>
              
              <div style={{
                maxHeight: '240px',
                overflowY: 'auto'
              }}>
                {organizationMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email
                      createDMConversation(member.userId, memberName)
                      setShowMemberSelector(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${colors.lightGray}20`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 200ms ease-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.softGreen
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.evergreen + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.evergreen
                    }}>
                      {member.imageUrl ? (
                        <img 
                          src={member.imageUrl}
                          alt={member.firstName || ''}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase()
                      )}
                    </div>
                    <div style={{
                      flex: 1,
                      textAlign: 'left'
                    }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.charcoal
                      }}>
                        {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.mediumGray
                      }}>
                        {member.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversations */}
        {filteredConversations.map((conversation, index) => (
          <motion.button
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectConversation(conversation)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              transition: 'all 200ms ease-out',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {/* Icon */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: conversation.type === 'dm' ? '50%' : '8px',
              backgroundColor: conversation.type === 'dm' ? colors.lightGray : colors.evergreen + '10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative'
            }}>
              {conversation.type === 'channel' ? (
                <Hash size={18} color={colors.evergreen} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: colors.evergreen + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.evergreen
                }}>
                  {conversation.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              
              {/* Online indicator for DMs */}
              {conversation.type === 'dm' && conversation.isOnline && (
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: `2px solid ${colors.white}`
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              minWidth: 0
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  {conversation.name}
                </div>
                {conversation.lastMessage && (
                  <div style={{
                    fontSize: '11px',
                    color: colors.mediumGray
                  }}>
                    {formatTime(conversation.lastMessage.timestamp)}
                  </div>
                )}
              </div>
              
              {conversation.lastMessage && (
                <div style={{
                  fontSize: '12px',
                  color: colors.mediumGray,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {conversation.lastMessage.userName}: {conversation.lastMessage.text}
                </div>
              )}
            </div>

            {/* Unread badge */}
            {conversation.unreadCount > 0 && (
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: colors.evergreen,
                color: colors.white,
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {conversation.unreadCount}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}