'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  FileText,
  Edit3,
  Trash2,
  Send,
  Paperclip,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  Mail
} from 'lucide-react';

export default function DraftsPage() {
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
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
  
  // Get draft emails
  const { data: drafts, isLoading, refetch } = trpc.evermail.getEmails.useQuery({
    folder: 'drafts',
    limit: 50
  });

  // Delete draft mutation
  const deleteDraft = trpc.evermail.deleteEmail.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedDraft(null);
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

  const handleDraftClick = (draft: any) => {
    setSelectedDraft(draft);
  };

  const handleDeleteClick = (draftId: string) => {
    deleteDraft.mutate({ emailId: draftId });
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
            <FileText size={40} color={colors.evergreen} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px',
            letterSpacing: '-0.01em'
          }}>
            No Email Drafts
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.mediumGray,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            Connect your Gmail to save drafts and compose emails directly from EverMail.
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
      {/* Draft List */}
      <div style={{
        width: selectedDraft ? '400px' : '100%',
        borderRight: selectedDraft ? `1px solid ${colors.lightGray}40` : 'none',
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
              Drafts
            </h1>
            <motion.button
              onClick={() => window.location.href = '/mail/compose'}
              style={{
                padding: '8px 12px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} />
              New Draft
            </motion.button>
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
              placeholder="Search drafts..."
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

        {/* Draft List */}
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
          ) : drafts?.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              color: colors.mediumGray
            }}>
              <FileText size={48} color={colors.lightGray} style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', color: colors.mediumGray }}>No drafts</p>
              <p style={{ fontSize: '13px', color: colors.mediumGray, marginTop: '8px' }}>
                Click "New Draft" to compose an email
              </p>
            </div>
          ) : (
            drafts?.map((draft: any) => (
              <motion.div
                key={draft.id}
                onClick={() => handleDraftClick(draft)}
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${colors.lightGray}40`,
                  cursor: 'pointer',
                  backgroundColor: selectedDraft?.id === draft.id ? colors.softGreen : colors.white,
                  transition: 'all 150ms ease'
                }}
                whileHover={{
                  backgroundColor: selectedDraft?.id === draft.id ? colors.softGreen : '#FAFBFC'
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
                    <FileText size={16} color={colors.mediumGray} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.charcoal,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {draft.data.to?.length > 0 
                        ? `To: ${draft.data.to.map((r: any) => r.email).join(', ')}`
                        : 'No recipients'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: colors.mediumGray,
                    flexShrink: 0
                  }}>
                    {formatDistanceToNow(new Date(draft.createdAt), { addSuffix: true })}
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
                    color: draft.data.subject ? colors.charcoal : colors.mediumGray,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    fontStyle: draft.data.subject ? 'normal' : 'italic'
                  }}>
                    {draft.data.subject || '(no subject)'}
                  </span>
                  {draft.data.attachments?.length > 0 && (
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
                  {draft.data.body?.snippet || 'Empty draft'}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Draft Editor */}
      {selectedDraft && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.white
        }}>
          {/* Draft Header */}
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
              }}>
                {selectedDraft.data.subject || '(no subject)'}
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <motion.button
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
                  <Edit3 size={18} color={colors.mediumGray} />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteClick(selectedDraft.id)}
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
            {selectedDraft.data.to?.length > 0 && (
              <div style={{
                fontSize: '14px',
                color: colors.mediumGray
              }}>
                To: {selectedDraft.data.to.map((r: any) => r.email).join(', ')}
              </div>
            )}
            {selectedDraft.data.cc?.length > 0 && (
              <div style={{
                fontSize: '14px',
                color: colors.mediumGray,
                marginTop: '2px'
              }}>
                Cc: {selectedDraft.data.cc.map((r: any) => r.email).join(', ')}
              </div>
            )}
            <div style={{
              fontSize: '13px',
              color: colors.mediumGray,
              marginTop: '4px'
            }}>
              Last edited: {new Date(selectedDraft.updatedAt || selectedDraft.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Draft Body */}
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
                maxWidth: '100%',
                minHeight: '200px'
              }}
              dangerouslySetInnerHTML={{ 
                __html: selectedDraft.data.body?.html || selectedDraft.data.body?.text?.replace(/\n/g, '<br>') || '<em style="color: #6B7280">Empty draft</em>'
              }}
            />
            
            {/* Attachments */}
            {selectedDraft.data.attachments?.length > 0 && (
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
                  {selectedDraft.data.attachments.map((attachment: any, idx: number) => (
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
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send size={16} />
              Send
            </motion.button>
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
              <Edit3 size={16} />
              Edit Draft
            </motion.button>
            <motion.button 
              onClick={() => handleDeleteClick(selectedDraft.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: colors.white,
                color: '#DC2626',
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
              whileHover={{ 
                backgroundColor: '#FEE2E2',
                borderColor: '#DC2626' + '30'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={16} />
              Delete
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}