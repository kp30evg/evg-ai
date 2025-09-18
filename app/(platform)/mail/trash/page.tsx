'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GmailConnectionStatus from '@/components/mail/GmailConnectionStatus';
import { 
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  RotateCcw,
  Trash,
  AlertCircle
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
    error: '#EF4444',
    errorLight: '#FEF2F2'
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

export default function TrashPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Get trashed emails
  const { data: emails, isLoading, refetch } = trpc.evermail.getEmails.useQuery({
    folder: 'trash',
    limit: 50
  }, {
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Restore email mutation
  const restoreEmail = trpc.evermail.restoreFromTrash.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmails(new Set());
    }
  });

  // Permanently delete mutation
  const permanentlyDelete = trpc.evermail.permanentlyDelete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEmails(new Set());
    }
  });

  // Empty trash mutation
  const emptyTrash = trpc.evermail.emptyTrash.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleRestoreSelected = () => {
    selectedEmails.forEach(emailId => {
      restoreEmail.mutate({ emailId });
    });
  };

  const handleDeleteSelected = () => {
    if (confirm('Permanently delete selected emails? This cannot be undone.')) {
      selectedEmails.forEach(emailId => {
        permanentlyDelete.mutate({ emailId });
      });
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Empty trash? All emails will be permanently deleted. This cannot be undone.')) {
      emptyTrash.mutate();
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
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
      height: '100%',
      backgroundColor: tokens.colors.white,
      fontFamily: tokens.typography.fontFamily,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Gmail Connection Prompt */}
      <GmailConnectionStatus showOnlyIfDisconnected={true} />
      
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
            <Trash2 size={24} color={tokens.colors.error} strokeWidth={2} />
            <h1 style={{
              fontSize: tokens.typography.sizes['2xl'],
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.charcoal,
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: tokens.typography.lineHeights.tight
            }}>
              Trash
            </h1>
            {filteredEmails.length > 0 && (
              <span style={{
                fontSize: tokens.typography.sizes.xs,
                fontWeight: tokens.typography.weights.medium,
                color: tokens.colors.error,
                backgroundColor: tokens.colors.errorLight,
                padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                borderRadius: tokens.radii.full,
                border: `1px solid ${tokens.colors.error}20`
              }}>
                {filteredEmails.length} items
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          {selectedEmails.size > 0 ? (
            <>
              <motion.button
                onClick={handleRestoreSelected}
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
                  gap: tokens.spacing.sm,
                  boxShadow: tokens.shadows.sm
                }}
                whileHover={{ 
                  transform: 'translateY(-1px)',
                  boxShadow: tokens.shadows.md
                }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw size={16} strokeWidth={2} />
                Restore ({selectedEmails.size})
              </motion.button>
              <motion.button
                onClick={handleDeleteSelected}
                style={{
                  padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                  backgroundColor: tokens.colors.error,
                  color: tokens.colors.white,
                  border: 'none',
                  borderRadius: tokens.radii.md,
                  fontSize: tokens.typography.sizes.sm,
                  fontWeight: tokens.typography.weights.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  boxShadow: tokens.shadows.sm
                }}
                whileHover={{ 
                  transform: 'translateY(-1px)',
                  boxShadow: tokens.shadows.md
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash size={16} strokeWidth={2} />
                Delete Forever
              </motion.button>
            </>
          ) : (
            filteredEmails.length > 0 && (
              <motion.button
                onClick={handleEmptyTrash}
                style={{
                  padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                  backgroundColor: tokens.colors.white,
                  color: tokens.colors.error,
                  border: `1px solid ${tokens.colors.error}`,
                  borderRadius: tokens.radii.md,
                  fontSize: tokens.typography.sizes.sm,
                  fontWeight: tokens.typography.weights.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm
                }}
                whileHover={{ 
                  backgroundColor: tokens.colors.errorLight,
                  transform: 'translateY(-1px)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash size={16} strokeWidth={2} />
                Empty Trash
              </motion.button>
            )
          )}
          
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
            placeholder="Search in trash..."
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
        
        {/* Info Message */}
        <div style={{
          marginTop: tokens.spacing.md,
          padding: tokens.spacing.md,
          backgroundColor: tokens.colors.errorLight,
          borderRadius: tokens.radii.md,
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.sm
        }}>
          <AlertCircle size={14} color={tokens.colors.error} strokeWidth={2} />
          <span style={{
            fontSize: tokens.typography.sizes.xs,
            color: tokens.colors.error
          }}>
            Items in trash will be automatically deleted after 30 days
          </span>
        </div>
      </div>

      {/* Email List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: tokens.spacing.lg
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
              <Trash2 size={24} color={tokens.colors.gray400} strokeWidth={1.5} />
            </div>
            <p style={{ 
              fontSize: tokens.typography.sizes.base, 
              color: tokens.colors.gray500,
              margin: 0,
              marginBottom: tokens.spacing.sm
            }}>
              {searchQuery ? 'No emails match your search' : 'Trash is empty'}
            </p>
            <p style={{ 
              fontSize: tokens.typography.sizes.sm, 
              color: tokens.colors.gray400,
              margin: 0
            }}>
              Deleted emails will appear here
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: tokens.spacing.md
          }}>
            <AnimatePresence>
              {filteredEmails.map((email: any, index: number) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  style={{
                    padding: tokens.spacing.lg,
                    backgroundColor: selectedEmails.has(email.id) ? tokens.colors.errorLight : tokens.colors.white,
                    border: `1px solid ${selectedEmails.has(email.id) ? tokens.colors.error : tokens.colors.gray200}`,
                    borderRadius: tokens.radii.lg,
                    cursor: 'pointer',
                    transition: tokens.transitions.fast
                  }}
                  onClick={() => toggleEmailSelection(email.id)}
                  onMouseEnter={(e) => {
                    if (!selectedEmails.has(email.id)) {
                      e.currentTarget.style.backgroundColor = tokens.colors.gray50;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedEmails.has(email.id)) {
                      e.currentTarget.style.backgroundColor = tokens.colors.white;
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: tokens.spacing.sm
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: tokens.spacing.sm,
                        marginBottom: tokens.spacing.xs
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedEmails.has(email.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleEmailSelection(email.id);
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          fontSize: tokens.typography.sizes.base,
                          fontWeight: tokens.typography.weights.medium,
                          color: tokens.colors.charcoal
                        }}>
                          {email.data.from?.name || email.data.from?.email || 'Unknown sender'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: tokens.typography.sizes.base,
                        fontWeight: tokens.typography.weights.medium,
                        color: tokens.colors.gray700,
                        marginBottom: tokens.spacing.xs
                      }}>
                        {email.data.subject || '(No subject)'}
                      </div>
                      <p style={{
                        fontSize: tokens.typography.sizes.sm,
                        color: tokens.colors.gray500,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {email.data.snippet || email.data.body?.snippet || 'No preview available'}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: tokens.spacing.sm
                    }}>
                      <span style={{
                        fontSize: tokens.typography.sizes.xs,
                        color: tokens.colors.gray500
                      }}>
                        {formatDistanceToNow(new Date(email.data.deletedAt || email.updatedAt), { addSuffix: true })}
                      </span>
                      <div style={{ display: 'flex', gap: tokens.spacing.xs }}>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreEmail.mutate({ emailId: email.id });
                          }}
                          style={{
                            padding: tokens.spacing.sm,
                            backgroundColor: tokens.colors.white,
                            border: `1px solid ${tokens.colors.gray200}`,
                            borderRadius: tokens.radii.md,
                            cursor: 'pointer',
                            transition: tokens.transitions.fast
                          }}
                          whileHover={{ backgroundColor: tokens.colors.softGreen }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <RotateCcw size={14} color={tokens.colors.evergreen} strokeWidth={2} />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Permanently delete this email? This cannot be undone.')) {
                              permanentlyDelete.mutate({ emailId: email.id });
                            }
                          }}
                          style={{
                            padding: tokens.spacing.sm,
                            backgroundColor: tokens.colors.white,
                            border: `1px solid ${tokens.colors.gray200}`,
                            borderRadius: tokens.radii.md,
                            cursor: 'pointer',
                            transition: tokens.transitions.fast
                          }}
                          whileHover={{ 
                            backgroundColor: tokens.colors.errorLight,
                            borderColor: tokens.colors.error
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash size={14} color={tokens.colors.error} strokeWidth={2} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}