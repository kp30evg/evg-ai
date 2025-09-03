'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  Forward,
  Paperclip,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox as InboxIcon,
  Plus,
  Send,
  MoreVertical,
  Clock,
  CheckCircle2
} from 'lucide-react';

// Design System Tokens
const tokens = {
  colors: {
    // Primary
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    
    // Grays
    gray50: '#FAFBFC',
    gray100: '#F1F3F5',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    
    // Accent
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    
    // Semantic
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6'
  },
  
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '36px'
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.7
    }
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px'
  },
  
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 16px rgba(0, 0, 0, 0.06)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.08)',
    xl: '0 25px 70px rgba(0, 0, 0, 0.1)'
  },
  
  transitions: {
    fast: '150ms ease-out',
    base: '200ms ease-out',
    slow: '300ms ease-out'
  }
};

export default function InboxPage() {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Get Gmail status
  const { data: gmailStatus } = trpc.evermail.getGmailStatus.useQuery();
  
  // Get emails
  const { data: emails, isLoading, refetch } = trpc.evermail.getEmails.useQuery({
    folder: 'inbox',
    limit: 50
  });

  // Mark as read mutation
  const markAsRead = trpc.evermail.markAsRead.useMutation({
    onSuccess: () => refetch()
  });

  // Toggle star mutation
  const toggleStar = trpc.evermail.toggleStar.useMutation({
    onSuccess: () => refetch()
  });

  // Archive email mutation
  const archiveEmail = trpc.evermail.archiveEmail.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmail(null);
    }
  });

  // Delete email mutation
  const deleteEmail = trpc.evermail.deleteEmail.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmail(null);
    }
  });

  // Sync emails mutation
  const syncEmails = trpc.evermail.syncEmails.useMutation({
    onSuccess: () => {
      refetch();
      setIsRefreshing(false);
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncEmails.mutateAsync();
  };

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    if (!email.data.isRead) {
      markAsRead.mutate({ emailIds: [email.id], isRead: true });
    }
  };

  const handleStarClick = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    toggleStar.mutate({ emailId });
  };

  const handleArchiveClick = (emailId: string) => {
    archiveEmail.mutate({ emailId });
  };

  const handleDeleteClick = (emailId: string) => {
    deleteEmail.mutate({ emailId });
  };

  // Helper function to check if email matches search
  const emailMatchesSearch = (email: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.data.subject?.toLowerCase().includes(query) ||
      email.data.from?.name?.toLowerCase().includes(query) ||
      email.data.from?.email?.toLowerCase().includes(query) ||
      email.data.body?.snippet?.toLowerCase().includes(query)
    );
  };

  const filteredEmails = emails?.filter(emailMatchesSearch) || [];

  if (!gmailStatus?.connected) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: tokens.colors.gray50,
        padding: tokens.spacing['2xl'],
        fontFamily: tokens.typography.fontFamily
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            textAlign: 'center',
            maxWidth: '480px'
          }}
        >
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: tokens.radii.xl,
            backgroundColor: tokens.colors.softGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: `0 auto ${tokens.spacing.xl}`
          }}>
            <InboxIcon size={32} color={tokens.colors.evergreen} strokeWidth={1.5} />
          </div>
          <h2 style={{
            fontSize: tokens.typography.sizes['2xl'],
            fontWeight: tokens.typography.weights.semibold,
            color: tokens.colors.charcoal,
            marginBottom: tokens.spacing.md,
            letterSpacing: '-0.01em'
          }}>
            Connect Your Gmail
          </h2>
          <p style={{
            fontSize: tokens.typography.sizes.base,
            color: tokens.colors.gray500,
            marginBottom: tokens.spacing['2xl'],
            lineHeight: tokens.typography.lineHeights.relaxed
          }}>
            Import your Gmail to start managing emails with AI-powered features.
          </p>
          <motion.button
            onClick={() => window.location.href = '/mail/settings'}
            style={{
              padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
              backgroundColor: tokens.colors.evergreen,
              color: tokens.colors.white,
              border: 'none',
              borderRadius: tokens.radii.md,
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.medium,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: tokens.spacing.sm
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mail size={16} strokeWidth={2} />
            Connect Gmail Account
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: tokens.colors.gray50,
      fontFamily: tokens.typography.fontFamily
    }}>
      {/* Email List */}
      <div style={{
        width: selectedEmail ? '380px' : '100%',
        minWidth: selectedEmail ? '380px' : 'auto',
        borderRight: selectedEmail ? `1px solid ${tokens.colors.gray200}` : 'none',
        backgroundColor: tokens.colors.white,
        display: 'flex',
        flexDirection: 'column',
        transition: tokens.transitions.base
      }}>
        {/* Header */}
        <div style={{
          padding: tokens.spacing.lg,
          borderBottom: `1px solid ${tokens.colors.gray100}`,
          backgroundColor: tokens.colors.white
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.lg
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.sm,
              flex: 1
            }}>
              <h1 style={{
                fontSize: tokens.typography.sizes.lg,
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal,
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                Inbox
              </h1>
            </div>
            {filteredEmails.length > 0 && (
              <span style={{
                fontSize: tokens.typography.sizes.xs,
                fontWeight: tokens.typography.weights.medium,
                color: tokens.colors.gray500,
                backgroundColor: tokens.colors.gray100,
                padding: `2px ${tokens.spacing.sm}`,
                borderRadius: tokens.radii.full
              }}>
                {filteredEmails.filter((e: any) => !e.data.isRead).length} unread
              </span>
            )}
            <motion.button
              onClick={() => window.location.href = '/mail/compose'}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: tokens.colors.evergreen,
                color: tokens.colors.white,
                border: 'none',
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.xs
              }}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={14} strokeWidth={2} />
              Compose
            </motion.button>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.gray50 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw 
                size={14} 
                color={tokens.colors.gray600}
                strokeWidth={2}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </motion.button>
          </div>
          {/* Search Bar */}
          <div style={{
            position: 'relative'
          }}>
            <Search 
              size={14} 
              strokeWidth={2}
              style={{
                position: 'absolute',
                left: tokens.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.colors.gray400,
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${tokens.spacing.sm} ${tokens.spacing.md} ${tokens.spacing.sm} 36px`,
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                outline: 'none',
                backgroundColor: tokens.colors.gray50,
                transition: tokens.transitions.fast,
                fontFamily: tokens.typography.fontFamily
              }}
              onFocus={(e) => {
                e.target.style.borderColor = tokens.colors.evergreen;
                e.target.style.backgroundColor = tokens.colors.white;
                e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.softGreen}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = tokens.colors.gray200;
                e.target.style.backgroundColor = tokens.colors.gray50;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Email List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing['3xl']
            }}>
              <Loader2 size={20} color={tokens.colors.evergreen} strokeWidth={2} className="animate-spin" />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: tokens.spacing['3xl'],
              color: tokens.colors.gray500
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: tokens.radii.full,
                backgroundColor: tokens.colors.gray100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: tokens.spacing.lg
              }}>
                <Mail size={24} color={tokens.colors.gray400} strokeWidth={1.5} />
              </div>
              <p style={{ 
                fontSize: tokens.typography.sizes.sm, 
                color: tokens.colors.gray500,
                margin: 0
              }}>
                {searchQuery ? 'No emails match your search' : 'No emails in your inbox'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredEmails.map((email: any, index: number) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  onClick={() => handleEmailClick(email)}
                  style={{
                    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                    borderBottom: `1px solid ${tokens.colors.gray100}`,
                    cursor: 'pointer',
                    backgroundColor: 
                      selectedEmail?.id === email.id ? tokens.colors.gray50 :
                      !email.data.isRead ? tokens.colors.white : tokens.colors.white,
                    transition: tokens.transitions.fast,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = tokens.colors.gray50;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = tokens.colors.white;
                    }
                  }}
                >
                  {/* Unread Indicator */}
                  {!email.data.isRead && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      backgroundColor: tokens.colors.evergreen,
                      borderTopLeftRadius: tokens.radii.sm,
                      borderBottomLeftRadius: tokens.radii.sm
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: tokens.spacing.xs
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing.sm,
                      flex: 1,
                      minWidth: 0
                    }}>
                      <motion.button
                        onClick={(e) => handleStarClick(e, email.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: tokens.spacing.xs,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: tokens.radii.sm
                        }}
                        whileHover={{ backgroundColor: tokens.colors.gray100 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Star 
                          size={14}
                          fill={email.data.isStarred ? tokens.colors.gold : 'none'}
                          color={email.data.isStarred ? tokens.colors.gold : tokens.colors.gray400}
                          strokeWidth={2}
                        />
                      </motion.button>
                      <span style={{
                        fontSize: tokens.typography.sizes.sm,
                        fontWeight: !email.data.isRead ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                        color: !email.data.isRead ? tokens.colors.charcoal : tokens.colors.gray700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {email.data.from?.name || email.data.from?.email}
                      </span>
                    </div>
                    <span style={{
                      fontSize: tokens.typography.sizes.xs,
                      color: tokens.colors.gray500,
                      flexShrink: 0
                    }}>
                      {formatDistanceToNow(new Date(email.data.sentAt || email.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: tokens.spacing.sm,
                    marginBottom: tokens.spacing.xs
                  }}>
                    <span style={{
                      fontSize: tokens.typography.sizes.sm,
                      fontWeight: !email.data.isRead ? tokens.typography.weights.medium : tokens.typography.weights.regular,
                      color: !email.data.isRead ? tokens.colors.charcoal : tokens.colors.gray600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      lineHeight: tokens.typography.lineHeights.tight
                    }}>
                      {email.data.subject || '(No subject)'}
                    </span>
                    {email.data.attachments?.length > 0 && (
                      <Paperclip size={12} color={tokens.colors.gray400} strokeWidth={2} />
                    )}
                  </div>
                  <p style={{
                    fontSize: tokens.typography.sizes.xs,
                    color: tokens.colors.gray500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    lineHeight: tokens.typography.lineHeights.base
                  }}>
                    {email.data.body?.snippet || 'No preview available'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Email Viewer Panel */}
      {selectedEmail && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: tokens.colors.white
          }}>
          {/* Email Header */}
          <div style={{
            padding: tokens.spacing.xl,
            borderBottom: `1px solid ${tokens.colors.gray100}`,
            backgroundColor: tokens.colors.white
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.lg
            }}>
              <h2 style={{
                fontSize: tokens.typography.sizes.xl,
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal,
                margin: 0,
                letterSpacing: '-0.01em',
                lineHeight: tokens.typography.lineHeights.tight
              }}>{selectedEmail.data.subject || '(No subject)'}</h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.xs
              }}>
                <motion.button
                  onClick={() => handleStarClick(new MouseEvent('click') as any, selectedEmail.id)}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ backgroundColor: tokens.colors.gray50 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star 
                    size={16}
                    fill={selectedEmail.data.isStarred ? tokens.colors.gold : 'none'}
                    color={selectedEmail.data.isStarred ? tokens.colors.gold : tokens.colors.gray500}
                    strokeWidth={2}
                  />
                </motion.button>
                <motion.button
                  onClick={() => handleArchiveClick(selectedEmail.id)}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ backgroundColor: tokens.colors.gray50 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Archive size={16} color={tokens.colors.gray500} strokeWidth={2} />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteClick(selectedEmail.id)}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ 
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FCA5A5'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={16} color={tokens.colors.gray500} strokeWidth={2} />
                </motion.button>
                <motion.button
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ backgroundColor: tokens.colors.gray50 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MoreVertical size={16} color={tokens.colors.gray500} strokeWidth={2} />
                </motion.button>
              </div>
            </div>
            {/* Sender Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.md,
              marginBottom: tokens.spacing.sm
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: tokens.radii.full,
                backgroundColor: tokens.colors.evergreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.colors.white,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
                flexShrink: 0
              }}>
                {(selectedEmail.data.from?.name || selectedEmail.data.from?.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm
                }}>
                  <span style={{
                    fontSize: tokens.typography.sizes.sm,
                    fontWeight: tokens.typography.weights.medium,
                    color: tokens.colors.charcoal
                  }}>
                    {selectedEmail.data.from?.name || 'Unknown Sender'}
                  </span>
                  <span style={{
                    fontSize: tokens.typography.sizes.xs,
                    color: tokens.colors.gray500
                  }}>
                    {selectedEmail.data.from?.email}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  marginTop: tokens.spacing.xs
                }}>
                  <Clock size={12} color={tokens.colors.gray400} strokeWidth={2} />
                  <span style={{
                    fontSize: tokens.typography.sizes.xs,
                    color: tokens.colors.gray500
                  }}>
                    {new Date(selectedEmail.data.sentAt || selectedEmail.createdAt).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                  {selectedEmail.data.to?.length > 0 && (
                    <>
                      <span style={{ color: tokens.colors.gray300 }}>•</span>
                      <span style={{
                        fontSize: tokens.typography.sizes.xs,
                        color: tokens.colors.gray500
                      }}>
                        To: {selectedEmail.data.to.slice(0, 2).map((r: any) => r.name || r.email).join(', ')}
                        {selectedEmail.data.to.length > 2 && ` +${selectedEmail.data.to.length - 2} more`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: `${tokens.spacing['2xl']} ${tokens.spacing['3xl']}`,
            backgroundColor: tokens.colors.gray50
          }}>
            <div style={{
              maxWidth: '720px',
              margin: '0 auto',
              backgroundColor: tokens.colors.white,
              borderRadius: tokens.radii.lg,
              padding: tokens.spacing['2xl'],
              boxShadow: tokens.shadows.sm
            }}>
              <div 
                style={{
                  fontSize: tokens.typography.sizes.base,
                  lineHeight: tokens.typography.lineHeights.relaxed,
                  color: tokens.colors.charcoal,
                  fontFamily: tokens.typography.fontFamily
                }}
                dangerouslySetInnerHTML={{ 
                  __html: selectedEmail.data.body?.html || 
                         selectedEmail.data.body?.text?.replace(/\n/g, '<br>') || 
                         '<p style="color: #9CA3AF">No content available</p>'
                }}
              />
            
              {/* Attachments */}
              {selectedEmail.data.attachments?.length > 0 && (
                <div style={{
                  marginTop: tokens.spacing.xl,
                  paddingTop: tokens.spacing.xl,
                  borderTop: `1px solid ${tokens.colors.gray100}`
                }}>
                  <h3 style={{
                    fontSize: tokens.typography.sizes.sm,
                    fontWeight: tokens.typography.weights.semibold,
                    color: tokens.colors.charcoal,
                    marginBottom: tokens.spacing.md
                  }}>Attachments ({selectedEmail.data.attachments.length})</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: tokens.spacing.sm
                  }}>
                    {selectedEmail.data.attachments.map((attachment: any, idx: number) => (
                      <motion.div 
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: tokens.spacing.sm,
                          padding: tokens.spacing.md,
                          border: `1px solid ${tokens.colors.gray200}`,
                          borderRadius: tokens.radii.md,
                          backgroundColor: tokens.colors.white,
                          cursor: 'pointer',
                          transition: tokens.transitions.fast
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: tokens.radii.md,
                          backgroundColor: tokens.colors.gray100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Paperclip size={14} color={tokens.colors.gray500} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: tokens.typography.sizes.xs,
                            color: tokens.colors.charcoal,
                            fontWeight: tokens.typography.weights.medium,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {attachment.filename}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: tokens.colors.gray500
                          }}>
                            {Math.round(attachment.size / 1024)} KB
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{
            padding: tokens.spacing.lg,
            borderTop: `1px solid ${tokens.colors.gray100}`,
            backgroundColor: tokens.colors.white,
            display: 'flex',
            gap: tokens.spacing.sm
          }}>
            <motion.button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.sm,
                padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                backgroundColor: tokens.colors.evergreen,
                color: tokens.colors.white,
                border: 'none',
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
                cursor: 'pointer',
                transition: tokens.transitions.fast
              }}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
            >
              <Reply size={14} strokeWidth={2} />
              Reply
            </motion.button>
            <motion.button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.sm,
                padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                backgroundColor: tokens.colors.white,
                color: tokens.colors.gray700,
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
                cursor: 'pointer',
                transition: tokens.transitions.fast
              }}
              whileHover={{ 
                backgroundColor: tokens.colors.gray50,
                borderColor: tokens.colors.gray300
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Forward size={14} strokeWidth={2} />
              Forward
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}