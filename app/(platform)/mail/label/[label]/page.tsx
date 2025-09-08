'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ComposeModal from '@/components/mail/ComposeModal';
import { LabelBadgeGroup } from '@/components/mail/LabelBadge';
import { getLabel } from '@/lib/evermail/constants/labels';
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
  ArrowLeft,
  Sparkles
} from 'lucide-react';

// Reuse tokens from inbox page
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
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6'
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

export default function LabelFilterPage() {
  const params = useParams();
  const router = useRouter();
  const labelId = params.label as string;
  const label = getLabel(labelId);
  
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  // Get emails filtered by label
  const { data: emails, isLoading, refetch } = trpc.evermail.getEmailsByLabel.useQuery({
    label: labelId,
    limit: 50
  }, {
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Mutations
  const markAsRead = trpc.evermail.markAsRead.useMutation({
    onSuccess: () => refetch()
  });

  const toggleStar = trpc.evermail.toggleStar.useMutation({
    onSuccess: () => refetch()
  });

  const archiveEmail = trpc.evermail.archiveEmail.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmail(null);
    }
  });

  const deleteEmail = trpc.evermail.deleteEmail.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmail(null);
    }
  });

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    if (!(email.data as any).isRead) {
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

  const emailMatchesSearch = (email: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (email.data as any).subject?.toLowerCase().includes(query) ||
      (email.data as any).from?.name?.toLowerCase().includes(query) ||
      (email.data as any).from?.email?.toLowerCase().includes(query) ||
      (email.data as any).body?.snippet?.toLowerCase().includes(query)
    );
  };

  const filteredEmails = emails?.filter(emailMatchesSearch) || [];

  if (!label) {
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
        <h2 style={{
          fontSize: tokens.typography.sizes['2xl'],
          fontWeight: tokens.typography.weights.semibold,
          color: tokens.colors.charcoal,
          marginBottom: tokens.spacing.md
        }}>
          Label not found
        </h2>
        <motion.button
          onClick={() => router.push('/mail/inbox')}
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
          <ArrowLeft size={16} strokeWidth={2} />
          Back to Inbox
        </motion.button>
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
            <motion.button
              onClick={() => router.push('/mail/inbox')}
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: tokens.radii.md,
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.gray100 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
            
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: tokens.radii.md,
              backgroundColor: label.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} color={label.color} strokeWidth={2} />
            </div>
            
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: tokens.typography.sizes['2xl'],
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.charcoal,
                margin: 0,
                letterSpacing: '-0.01em',
                lineHeight: tokens.typography.lineHeights.tight
              }}>
                {label.name}
              </h1>
              <p style={{
                fontSize: tokens.typography.sizes.xs,
                color: tokens.colors.gray500,
                margin: 0,
                marginTop: '2px'
              }}>
                {label.description}
              </p>
            </div>
            
            {filteredEmails.length > 0 && (
              <span style={{
                fontSize: tokens.typography.sizes.xs,
                fontWeight: tokens.typography.weights.medium,
                color: label.color,
                backgroundColor: label.bgColor,
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                borderRadius: tokens.radii.full,
                border: `1px solid ${label.borderColor}`
              }}>
                {filteredEmails.length} emails
              </span>
            )}
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
              placeholder={`Search in ${label.name.toLowerCase()}...`}
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
                e.target.style.borderColor = label.color;
                e.target.style.backgroundColor = tokens.colors.white;
                e.target.style.boxShadow = `0 0 0 3px ${label.bgColor}`;
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
              <Loader2 size={20} color={label.color} strokeWidth={2} className="animate-spin" />
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
                backgroundColor: label.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: tokens.spacing.lg
              }}>
                <Mail size={24} color={label.color} strokeWidth={1.5} />
              </div>
              <p style={{ 
                fontSize: tokens.typography.sizes.sm, 
                color: tokens.colors.gray500,
                margin: 0
              }}>
                {searchQuery ? `No ${label.name.toLowerCase()} emails match your search` : `No emails labeled as ${label.name}`}
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
                      selectedEmail?.id === email.id ? tokens.colors.softGreen :
                      !(email.data as any).isRead ? tokens.colors.white : tokens.colors.gray50,
                    transition: tokens.transitions.fast,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = !(email.data as any).isRead ? tokens.colors.gray50 : tokens.colors.gray100;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.backgroundColor = !(email.data as any).isRead ? tokens.colors.white : tokens.colors.gray50;
                    }
                  }}
                >
                  {/* Unread Indicator */}
                  {!(email.data as any).isRead && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      backgroundColor: label.color,
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
                        whileHover={{ backgroundColor: tokens.colors.gray100 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Star 
                          size={14}
                          fill={(email.data as any).isStarred ? tokens.colors.gold : 'none'}
                          color={(email.data as any).isStarred ? tokens.colors.gold : tokens.colors.gray400}
                          strokeWidth={2}
                        />
                      </motion.button>
                      <span style={{
                        fontSize: tokens.typography.sizes.base,
                        fontWeight: !(email.data as any).isRead ? tokens.typography.weights.semibold : tokens.typography.weights.medium,
                        color: !(email.data as any).isRead ? tokens.colors.charcoal : tokens.colors.gray500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {(email.data as any).from?.name || (email.data as any).from?.email}
                      </span>
                    </div>
                    <span style={{
                      fontSize: tokens.typography.sizes.xs,
                      color: tokens.colors.gray500,
                      flexShrink: 0
                    }}>
                      {formatDistanceToNow(new Date((email.data as any).sentAt || email.createdAt), { addSuffix: true })}
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
                      fontWeight: !(email.data as any).isRead ? tokens.typography.weights.semibold : tokens.typography.weights.regular,
                      color: !(email.data as any).isRead ? tokens.colors.charcoal : tokens.colors.gray500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      lineHeight: tokens.typography.lineHeights.base
                    }}>
                      {(email.data as any).subject || '(No subject)'}
                    </span>
                    {(email.data as any).attachments?.length > 0 && (
                      <Paperclip size={14} color={tokens.colors.gray500} strokeWidth={2} />
                    )}
                  </div>
                  
                  {/* Show all labels for this email */}
                  {email.metadata?.autoLabels && email.metadata.autoLabels.length > 0 && (
                    <div style={{ marginBottom: tokens.spacing.xs }}>
                      <LabelBadgeGroup
                        labelIds={email.metadata.autoLabels}
                        onLabelClick={(clickedLabelId) => {
                          if (clickedLabelId !== labelId) {
                            router.push(`/mail/label/${clickedLabelId}`);
                          }
                        }}
                        maxVisible={3}
                        size="sm"
                      />
                    </div>
                  )}
                  
                  <p style={{
                    fontSize: tokens.typography.sizes.xs,
                    color: tokens.colors.gray500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    margin: 0,
                    lineHeight: tokens.typography.lineHeights.base
                  }}>
                    {(() => {
                      const data = email.data as any;
                      if (data.snippet) {
                        return data.snippet.substring(0, 100);
                      }
                      const body = data.body;
                      if (body && typeof body === 'object') {
                        if (body.snippet) {
                          return body.snippet.substring(0, 100);
                        }
                        if (body.text) {
                          const plainText = body.text.replace(/<[^>]*>/g, '').substring(0, 100);
                          return plainText || 'No preview available';
                        }
                      } else if (typeof body === 'string') {
                        const plainText = body.replace(/<[^>]*>/g, '').substring(0, 100);
                        return plainText || 'No preview available';
                      }
                      return 'No preview available';
                    })()}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Email Viewer - reuse the same viewer from inbox */}
      {selectedEmail && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: tokens.colors.white,
          overflowY: 'auto'
        }}>
          {/* Email content would go here - simplified for now */}
          <div style={{
            padding: tokens.spacing['2xl'],
            borderBottom: `1px solid ${tokens.colors.gray200}`
          }}>
            <h2 style={{
              fontSize: tokens.typography.sizes['2xl'],
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.charcoal,
              marginBottom: tokens.spacing.md
            }}>
              {(selectedEmail.data as any).subject || '(No subject)'}
            </h2>
            <div style={{
              display: 'flex',
              gap: tokens.spacing.sm
            }}>
              <motion.button
                onClick={() => handleArchiveClick(selectedEmail.id)}
                style={{
                  padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.colors.gray200}`,
                  borderRadius: tokens.radii.md,
                  cursor: 'pointer',
                  fontSize: tokens.typography.sizes.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm
                }}
                whileHover={{ backgroundColor: tokens.colors.gray50 }}
                whileTap={{ scale: 0.95 }}
              >
                <Archive size={16} strokeWidth={2} />
                Archive
              </motion.button>
              <motion.button
                onClick={() => handleDeleteClick(selectedEmail.id)}
                style={{
                  padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${tokens.colors.gray200}`,
                  borderRadius: tokens.radii.md,
                  cursor: 'pointer',
                  fontSize: tokens.typography.sizes.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm
                }}
                whileHover={{ 
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FCA5A5'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 size={16} strokeWidth={2} />
                Delete
              </motion.button>
            </div>
          </div>
          <div style={{
            padding: tokens.spacing['2xl'],
            flex: 1
          }}>
            <p style={{
              fontSize: tokens.typography.sizes.base,
              color: tokens.colors.gray600,
              lineHeight: tokens.typography.lineHeights.relaxed
            }}>
              {(() => {
                const data = selectedEmail.data as any;
                const body = data.body;
                if (body && typeof body === 'object') {
                  return body.text || body.snippet || 'No content available';
                }
                return body || 'No content available';
              })()}
            </p>
          </div>
        </div>
      )}
      
      {/* Compose Modal */}
      <ComposeModal 
        isOpen={isComposeOpen || !!replyTo}
        onClose={() => {
          setIsComposeOpen(false);
          setReplyTo(null);
        }}
      />
    </div>
  );
}