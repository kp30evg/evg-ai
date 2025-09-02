'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { motion } from 'framer-motion';
import { 
  Send,
  X,
  Paperclip,
  Image,
  Link,
  Bold,
  Italic,
  List,
  Save,
  Mail,
  ChevronDown,
  Loader2
} from 'lucide-react';

export default function ComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params (for replies/forwards)
  const replyTo = searchParams.get('replyTo');
  const forwardFrom = searchParams.get('forwardFrom');
  const draftId = searchParams.get('draftId');
  
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
  
  // Send email mutation
  const sendEmail = trpc.evermail.sendEmail.useMutation({
    onSuccess: () => {
      router.push('/mail/sent');
    },
    onError: (error) => {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
      setIsSending(false);
    }
  });

  // Save draft mutation
  const saveDraft = trpc.evermail.saveDraft.useMutation({
    onSuccess: () => {
      setLastSaved(new Date());
      setIsSavingDraft(false);
    },
    onError: (error) => {
      console.error('Failed to save draft:', error);
      setIsSavingDraft(false);
    }
  });

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId) {
      // Load draft data
      // This would be implemented with a getDraft query
    }
  }, [draftId]);

  // Load reply/forward context
  useEffect(() => {
    if (replyTo) {
      // Load email to reply to
      // Set subject with "Re: "
      // Quote original message in body
    } else if (forwardFrom) {
      // Load email to forward
      // Set subject with "Fwd: "
      // Include original message in body
    }
  }, [replyTo, forwardFrom]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (to || subject || body) {
        handleSaveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [to, cc, bcc, subject, body]);

  const handleSend = async () => {
    if (!to) {
      alert('Please enter at least one recipient');
      return;
    }

    if (!subject && !confirm('Send email without subject?')) {
      return;
    }

    setIsSending(true);

    // Parse recipients - sendEmail expects array of email strings
    const toRecipients = to.split(',').map(email => email.trim()).filter(Boolean);
    const ccRecipients = cc ? cc.split(',').map(email => email.trim()).filter(Boolean) : [];
    const bccRecipients = bcc ? bcc.split(',').map(email => email.trim()).filter(Boolean) : [];

    await sendEmail.mutateAsync({
      to: toRecipients,
      cc: ccRecipients.length > 0 ? ccRecipients : undefined,
      bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
      subject: subject || '(no subject)',
      body: body
    });
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);

    const toRecipients = to ? to.split(',').map(email => ({ email: email.trim() })) : [];
    const ccRecipients = cc ? cc.split(',').map(email => ({ email: email.trim() })) : [];
    const bccRecipients = bcc ? bcc.split(',').map(email => ({ email: email.trim() })) : [];

    await saveDraft.mutateAsync({
      id: draftId,
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject,
      body: {
        text: body,
        html: body.replace(/\n/g, '<br>')
      },
      attachments
    });
  };

  const handleDiscard = () => {
    if (confirm('Discard this draft? Your changes will be lost.')) {
      router.push('/mail/inbox');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        filename: file.name,
        size: file.size,
        type: file.type,
        // In production, would upload to storage and get URL
        file
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
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
            <Mail size={40} color={colors.evergreen} />
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px',
            letterSpacing: '-0.01em'
          }}>
            Connect Gmail to Send Emails
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.mediumGray,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            Connect your Gmail account to compose and send emails directly from EverMail.
          </p>
          <motion.button
            onClick={() => router.push('/mail/settings')}
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
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#FAFBFC'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <motion.button
            onClick={handleDiscard}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={20} color={colors.mediumGray} />
          </motion.button>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.charcoal
          }}>
            New Message
          </h1>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {lastSaved && (
            <span style={{
              fontSize: '12px',
              color: colors.mediumGray
            }}>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.white,
              color: colors.charcoal,
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSavingDraft ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            whileHover={{ 
              backgroundColor: colors.softGreen,
              borderColor: colors.evergreen + '30'
            }}
            whileTap={{ scale: 0.98 }}
          >
            {isSavingDraft ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Draft
          </motion.button>
          <motion.button
            onClick={handleSend}
            disabled={isSending}
            style={{
              padding: '8px 20px',
              backgroundColor: colors.evergreen,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send
          </motion.button>
        </div>
      </div>

      {/* Compose Form */}
      <div style={{
        flex: 1,
        backgroundColor: colors.white,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Recipients */}
        <div style={{
          padding: '0 20px',
          borderBottom: `1px solid ${colors.lightGray}40`
        }}>
          {/* To Field */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0'
          }}>
            <label style={{
              width: '60px',
              fontSize: '14px',
              color: colors.mediumGray,
              flexShrink: 0
            }}>
              To:
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
              style={{
                flex: 1,
                padding: '4px 8px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: colors.charcoal,
                backgroundColor: 'transparent'
              }}
            />
            <motion.button
              onClick={() => setShowCc(!showCc)}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                color: colors.mediumGray,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              whileHover={{ backgroundColor: colors.softGreen }}
            >
              Cc
              <ChevronDown size={14} style={{
                transform: showCc ? 'rotate(180deg)' : 'none',
                transition: 'transform 200ms'
              }} />
            </motion.button>
            <motion.button
              onClick={() => setShowBcc(!showBcc)}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                color: colors.mediumGray,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              whileHover={{ backgroundColor: colors.softGreen }}
            >
              Bcc
              <ChevronDown size={14} style={{
                transform: showBcc ? 'rotate(180deg)' : 'none',
                transition: 'transform 200ms'
              }} />
            </motion.button>
          </div>

          {/* Cc Field */}
          {showCc && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: `1px solid ${colors.lightGray}40`
            }}>
              <label style={{
                width: '60px',
                fontSize: '14px',
                color: colors.mediumGray,
                flexShrink: 0
              }}>
                Cc:
              </label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Carbon copy recipients"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: colors.charcoal,
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: `1px solid ${colors.lightGray}40`
            }}>
              <label style={{
                width: '60px',
                fontSize: '14px',
                color: colors.mediumGray,
                flexShrink: 0
              }}>
                Bcc:
              </label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Blind carbon copy recipients"
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  color: colors.charcoal,
                  backgroundColor: 'transparent'
                }}
              />
            </div>
          )}
        </div>

        {/* Subject */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: `1px solid ${colors.lightGray}40`
        }}>
          <label style={{
            width: '60px',
            fontSize: '14px',
            color: colors.mediumGray,
            flexShrink: 0
          }}>
            Subject:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            style={{
              flex: 1,
              padding: '4px 8px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: colors.charcoal,
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div style={{
          padding: '8px 20px',
          borderBottom: `1px solid ${colors.lightGray}40`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <motion.button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <Bold size={16} color={colors.mediumGray} />
          </motion.button>
          <motion.button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <Italic size={16} color={colors.mediumGray} />
          </motion.button>
          <motion.button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <List size={16} color={colors.mediumGray} />
          </motion.button>
          <motion.button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <Link size={16} color={colors.mediumGray} />
          </motion.button>
          <motion.button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ backgroundColor: colors.softGreen }}
            whileTap={{ scale: 0.95 }}
          >
            <Image size={16} color={colors.mediumGray} />
          </motion.button>
          <div style={{ flex: 1 }} />
          <label>
            <motion.button
              as="div"
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: colors.mediumGray
              }}
              whileHover={{ 
                backgroundColor: colors.softGreen,
                borderColor: colors.evergreen + '30'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Paperclip size={14} />
              Attach
            </motion.button>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Compose your message..."
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              lineHeight: '1.6',
              color: colors.charcoal,
              backgroundColor: 'transparent',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />

          {/* Attachments */}
          {attachments.length > 0 && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${colors.lightGray}40`
            }}>
              <h3 style={{
                fontSize: '13px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '8px'
              }}>Attachments</h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {attachments.map((attachment, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '6px',
                    backgroundColor: colors.white,
                    fontSize: '13px'
                  }}>
                    <Paperclip size={14} color={colors.mediumGray} />
                    <span style={{ color: colors.charcoal }}>
                      {attachment.filename}
                    </span>
                    <span style={{ color: colors.mediumGray }}>
                      ({Math.round(attachment.size / 1024)}KB)
                    </span>
                    <motion.button
                      onClick={() => {
                        setAttachments(attachments.filter((_, i) => i !== idx));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={14} color={colors.mediumGray} />
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}