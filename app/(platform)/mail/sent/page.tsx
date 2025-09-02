'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Send,
  Star, 
  Archive, 
  Trash2,
  Forward,
  Paperclip,
  Search,
  RefreshCw,
  Loader2,
  Mail
} from 'lucide-react';

export default function SentPage() {
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Brand colors
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  };

  // Get Gmail status
  const { data: gmailStatus } = trpc.evermail.getGmailStatus.useQuery();
  
  // Get sent emails
  const { data: emails, isLoading, refetch } = trpc.evermail.getEmails.useQuery({
    folder: 'sent',
    limit: 50
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

  if (!gmailStatus?.connected) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#FAFBFC',
        padding: '32px'
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
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            backgroundColor: colors.softGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Send size={40} color={colors.evergreen} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px',
            letterSpacing: '-0.01em'
          }}>
            No Sent Emails
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.mediumGray,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            Connect your Gmail to see your sent emails and send new messages directly from EverMail.
          </p>
          <motion.button
            onClick={() => window.location.href = '/mail/settings'}
            style={{
              padding: '14px 28px',
              backgroundColor: colors.evergreen,
              color: colors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mail size={18} />
            Connect Gmail Account
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#FAFBFC'
    }}>
      {/* Email List */}
      <div style={{
        width: selectedEmail ? '400px' : '100%',
        borderRight: selectedEmail ? `1px solid ${colors.lightGray}40` : 'none',
        backgroundColor: colors.white,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Search */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${colors.lightGray}40`,
          backgroundColor: colors.white
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: colors.charcoal,
              flex: 1
            }}>
              Sent
            </h1>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              whileHover={{ backgroundColor: colors.softGreen }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw 
                size={18} 
                color={colors.mediumGray}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </motion.button>
          </div>
          <div style={{
            position: 'relative'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.mediumGray
              }}
            />
            <input
              type="text"
              placeholder="Search sent emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: colors.white,
                transition: 'all 200ms ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.evergreen;
                e.target.style.boxShadow = `0 0 0 3px ${colors.softGreen}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.lightGray;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Email List */}
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px'
            }}>
              <Loader2 size={24} color={colors.evergreen} className="animate-spin" />
            </div>
          ) : emails?.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              color: colors.mediumGray
            }}>
              <Send size={48} color={colors.lightGray} style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', color: colors.mediumGray }}>No sent emails</p>
            </div>
          ) : (
            emails?.map((email: any) => (
              <motion.div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.lightGray}40`,
                  cursor: 'pointer',
                  backgroundColor: selectedEmail?.id === email.id ? colors.softGreen : colors.white,
                  transition: 'all 150ms ease'
                }}
                whileHover={{
                  backgroundColor: selectedEmail?.id === email.id ? colors.softGreen : '#FAFBFC'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <motion.button
                      onClick={(e) => handleStarClick(e, email.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Star 
                        size={16}
                        fill={email.data.isStarred ? colors.gold : 'none'}
                        color={email.data.isStarred ? colors.gold : colors.mediumGray}
                      />
                    </motion.button>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.charcoal,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      To: {email.data.to?.map((r: any) => r.email).join(', ') || 'Unknown'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: colors.mediumGray,
                    flexShrink: 0
                  }}>
                    {formatDistanceToNow(new Date(email.data.sentAt || email.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '400',
                    color: colors.charcoal,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {email.data.subject}
                  </span>
                  {email.data.attachments?.length > 0 && (
                    <Paperclip size={14} color={colors.mediumGray} />
                  )}
                </div>
                <p style={{
                  fontSize: '13px',
                  color: colors.mediumGray,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0
                }}>
                  {email.data.body?.snippet}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Email Viewer */}
      {selectedEmail && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.white
        }}>
          {/* Email Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${colors.lightGray}40`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>{selectedEmail.data.subject}</h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <motion.button
                  onClick={() => handleStarClick(new MouseEvent('click') as any, selectedEmail.id)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  whileHover={{ backgroundColor: colors.softGreen }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Star 
                    size={18}
                    fill={selectedEmail.data.isStarred ? colors.gold : 'none'}
                    color={selectedEmail.data.isStarred ? colors.gold : colors.mediumGray}
                  />
                </motion.button>
                <motion.button
                  onClick={() => handleArchiveClick(selectedEmail.id)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  whileHover={{ backgroundColor: colors.softGreen }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Archive size={18} color={colors.mediumGray} />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteClick(selectedEmail.id)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  whileHover={{ backgroundColor: '#FEE2E2' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 size={18} color={colors.mediumGray} />
                </motion.button>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px'
            }}>
              <div>
                <span style={{
                  color: colors.mediumGray
                }}>From: </span>
                <span style={{
                  fontWeight: '500',
                  color: colors.charcoal
                }}>You</span>
              </div>
              <span style={{
                color: colors.mediumGray,
                fontSize: '13px'
              }}>
                {new Date(selectedEmail.data.sentAt || selectedEmail.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={{
              fontSize: '13px',
              color: colors.mediumGray,
              marginTop: '4px'
            }}>
              To: {selectedEmail.data.to?.map((r: any) => r.email).join(', ')}
            </div>
            {selectedEmail.data.cc?.length > 0 && (
              <div style={{
                fontSize: '13px',
                color: colors.mediumGray,
                marginTop: '2px'
              }}>
                Cc: {selectedEmail.data.cc.map((r: any) => r.email).join(', ')}
              </div>
            )}
          </div>

          {/* Email Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div 
              style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: colors.charcoal,
                maxWidth: '100%'
              }}
              dangerouslySetInnerHTML={{ 
                __html: selectedEmail.data.body?.html || selectedEmail.data.body?.text?.replace(/\n/g, '<br>') || ''
              }}
            />
            
            {/* Attachments */}
            {selectedEmail.data.attachments?.length > 0 && (
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: `1px solid ${colors.lightGray}40`
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  marginBottom: '12px'
                }}>Attachments</h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {selectedEmail.data.attachments.map((attachment: any, idx: number) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      backgroundColor: colors.white
                    }}>
                      <Paperclip size={16} color={colors.mediumGray} />
                      <span style={{
                        fontSize: '14px',
                        color: colors.charcoal,
                        flex: 1
                      }}>{attachment.filename}</span>
                      <span style={{
                        fontSize: '12px',
                        color: colors.mediumGray
                      }}>
                        ({Math.round(attachment.size / 1024)}KB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: '16px 20px',
            borderTop: `1px solid ${colors.lightGray}40`,
            display: 'flex',
            gap: '12px'
          }}>
            <motion.button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: colors.white,
                color: colors.charcoal,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              whileHover={{ 
                backgroundColor: colors.softGreen,
                borderColor: colors.evergreen + '30'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Forward size={16} />
              Forward
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}