'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ComposeModal from '@/components/mail/ComposeModal';
import GmailConnectionStatus from '@/components/mail/GmailConnectionStatus';
import { 
  Star,
  RefreshCw,
  Search,
  Loader2,
  Mail,
  Reply,
  Forward,
  Archive,
  Trash2,
  Paperclip
} from 'lucide-react';

// Design System Tokens (matching inbox page)
const tokens = {
  colors: {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    gray50: '#FAFBFC',
    gray100: '#F1F3F5',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    goldLight: '#FFF9E6'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
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
    '3xl': '48px'
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
    lg: '0 12px 32px rgba(0, 0, 0, 0.08)'
  },
  transitions: {
    fast: '150ms ease-out',
    base: '200ms ease-out',
    slow: '300ms ease-out'
  }
};

export default function StarredPage() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  // Get starred emails
  const { data: emails, isLoading, refetch } = trpc.evermail.getEmails.useQuery({
    folder: 'starred',
    limit: 50
  }, {
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
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

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: tokens.colors.gray50,
      fontFamily: tokens.typography.fontFamily,
      position: 'relative'
    }}>
      {/* Gmail Connection Prompt */}
      <GmailConnectionStatus showOnlyIfDisconnected={true} />
      
      {/* Email List */}
      <div style={{
        width: selectedEmail ? '420px' : '100%',
        minWidth: selectedEmail ? '420px' : 'auto',
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
              <Star size={24} fill={tokens.colors.gold} color={tokens.colors.gold} strokeWidth={2} />
              <h1 style={{
                fontSize: tokens.typography.sizes['2xl'],
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal,
                margin: 0,
                letterSpacing: '-0.01em',
                lineHeight: tokens.typography.lineHeights.tight
              }}>
                Starred
              </h1>
              {filteredEmails.length > 0 && (
                <span style={{
                  fontSize: tokens.typography.sizes.xs,
                  fontWeight: tokens.typography.weights.medium,
                  color: tokens.colors.gold,
                  backgroundColor: tokens.colors.goldLight,
                  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                  borderRadius: tokens.radii.full,
                  border: `1px solid ${tokens.colors.gold}40`
                }}>
                  {filteredEmails.length} starred
                </span>
              )}
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: tokens.spacing.md,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast,
                opacity: isRefreshing ? 0.6 : 1
              }}
              whileHover={{ 
                backgroundColor: tokens.colors.gray50,
                borderColor: tokens.colors.gray500
              }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw 
                size={16} 
                color={tokens.colors.gray500}
                strokeWidth={2}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </motion.button>
          </div>
          
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
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
              placeholder="Search starred emails..."
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
                e.target.style.borderColor = tokens.colors.gold;
                e.target.style.backgroundColor = tokens.colors.white;
                e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.goldLight}`;
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
              <Loader2 size={20} color={tokens.colors.gold} strokeWidth={2} className="animate-spin" />
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
                backgroundColor: tokens.colors.goldLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: tokens.spacing.lg
              }}>
                <Star size={24} color={tokens.colors.gold} strokeWidth={1.5} />
              </div>
              <p style={{ 
                fontSize: tokens.typography.sizes.base, 
                color: tokens.colors.gray500,
                margin: 0,
                marginBottom: tokens.spacing.sm
              }}>
                {searchQuery ? 'No starred emails match your search' : 'No starred messages'}
              </p>
              <p style={{ 
                fontSize: tokens.typography.sizes.sm, 
                color: tokens.colors.gray400,
                margin: 0
              }}>
                Stars let you give messages a special status to make them easier to find
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
                    padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
                    borderBottom: `1px solid ${tokens.colors.gray200}`,
                    cursor: 'pointer',
                    backgroundColor: 
                      selectedEmail?.id === email.id ? tokens.colors.goldLight :
                      !email.data.isRead ? tokens.colors.white : tokens.colors.gray50,
                    transition: tokens.transitions.fast,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = !email.data.isRead ? tokens.colors.gray50 : tokens.colors.gray100;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = !email.data.isRead ? tokens.colors.white : tokens.colors.gray50;
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
                      width: '4px',
                      backgroundColor: tokens.colors.evergreen,
                      borderTopRightRadius: tokens.radii.sm,
                      borderBottomRightRadius: tokens.radii.sm
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
                        whileHover={{ backgroundColor: tokens.colors.goldLight }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Star 
                          size={14}
                          fill={tokens.colors.gold}
                          color={tokens.colors.gold}
                          strokeWidth={2}
                        />
                      </motion.button>
                      <span style={{
                        fontSize: tokens.typography.sizes.base,
                        fontWeight: !email.data.isRead ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                        color: !email.data.isRead ? tokens.colors.charcoal : tokens.colors.gray500,
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
                      fontSize: tokens.typography.sizes.base,
                      fontWeight: !email.data.isRead ? tokens.typography.weights.semibold : tokens.typography.weights.regular,
                      color: !email.data.isRead ? tokens.colors.charcoal : tokens.colors.gray500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      lineHeight: tokens.typography.lineHeights.base
                    }}>
                      {email.data.subject || '(No subject)'}
                    </span>
                    {email.data.attachments?.length > 0 && (
                      <Paperclip size={14} color={tokens.colors.gray500} strokeWidth={2} />
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
                    {email.data.snippet || email.data.body?.snippet || 'No preview available'}
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
          {/* Email content viewer would go here - similar to inbox page */}
          <div style={{
            padding: tokens.spacing.xl,
            borderBottom: `1px solid ${tokens.colors.gray200}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: tokens.spacing.lg
            }}>
              <h2 style={{
                fontSize: tokens.typography.sizes.xl,
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal,
                margin: 0
              }}>
                {selectedEmail.data.subject || '(No subject)'}
              </h2>
              <div style={{
                display: 'flex',
                gap: tokens.spacing.sm
              }}>
                <motion.button
                  onClick={(e) => handleStarClick(e, selectedEmail.id)}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer'
                  }}
                  whileHover={{ backgroundColor: tokens.colors.goldLight }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star 
                    size={16}
                    fill={tokens.colors.gold}
                    color={tokens.colors.gold}
                    strokeWidth={2}
                  />
                </motion.button>
                <motion.button
                  onClick={() => archiveEmail.mutate({ emailId: selectedEmail.id })}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer'
                  }}
                  whileHover={{ backgroundColor: tokens.colors.gray50 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Archive size={16} color={tokens.colors.gray500} strokeWidth={2} />
                </motion.button>
                <motion.button
                  onClick={() => deleteEmail.mutate({ emailId: selectedEmail.id })}
                  style={{
                    padding: tokens.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer'
                  }}
                  whileHover={{ 
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FCA5A5'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={16} color={tokens.colors.gray500} strokeWidth={2} />
                </motion.button>
              </div>
            </div>
            
            {/* Sender info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.md
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
                fontWeight: tokens.typography.weights.medium
              }}>
                {(selectedEmail.data.from?.name || selectedEmail.data.from?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{
                  fontSize: tokens.typography.sizes.sm,
                  fontWeight: tokens.typography.weights.medium,
                  color: tokens.colors.charcoal
                }}>
                  {selectedEmail.data.from?.name || 'Unknown Sender'}
                </div>
                <div style={{
                  fontSize: tokens.typography.sizes.xs,
                  color: tokens.colors.gray500
                }}>
                  {selectedEmail.data.from?.email}
                </div>
              </div>
            </div>
          </div>
          
          {/* Email body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: tokens.spacing.xl
          }}>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontSize: tokens.typography.sizes.base,
              lineHeight: tokens.typography.lineHeights.relaxed,
              color: tokens.colors.charcoal
            }}>
              {selectedEmail.data.body?.text || selectedEmail.data.body?.snippet || 'No content available'}
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={{
            padding: tokens.spacing.xl,
            borderTop: `1px solid ${tokens.colors.gray200}`,
            display: 'flex',
            gap: tokens.spacing.md
          }}>
            <motion.button
              onClick={() => setReplyTo(selectedEmail)}
              style={{
                padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                backgroundColor: tokens.colors.evergreen,
                color: tokens.colors.white,
                border: 'none',
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.sm
              }}
              whileHover={{ transform: 'translateY(-1px)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Reply size={16} strokeWidth={2} />
              Reply
            </motion.button>
            <motion.button
              style={{
                padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                backgroundColor: tokens.colors.white,
                color: tokens.colors.gray500,
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                fontSize: tokens.typography.sizes.sm,
                fontWeight: tokens.typography.weights.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.sm
              }}
              whileHover={{ backgroundColor: tokens.colors.gray50 }}
              whileTap={{ scale: 0.98 }}
            >
              <Forward size={16} strokeWidth={2} />
              Forward
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Compose Modal */}
      <ComposeModal 
        isOpen={isComposeOpen || !!replyTo}
        onClose={() => {
          setIsComposeOpen(false);
          setReplyTo(null);
        }}
        defaultTo={replyTo ? replyTo.data.from?.email : ''}
        defaultSubject={replyTo ? `Re: ${replyTo.data.subject}` : ''}
        isReply={!!replyTo}
        replyToId={replyTo?.id}
      />
    </div>
  );
}