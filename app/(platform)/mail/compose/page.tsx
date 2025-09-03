'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send,
  X,
  Paperclip,
  Bold,
  Italic,
  Link2,
  List,
  Save,
  ChevronDown,
  Loader2,
  ArrowLeft
} from 'lucide-react';

// Design System Tokens (same as inbox)
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
    if (!to || !subject) {
      alert('Please enter a recipient and subject');
      return;
    }
    
    setIsSending(true);
    await sendEmail.mutateAsync({
      to: to.split(',').map(email => email.trim()),
      cc: cc ? cc.split(',').map(email => email.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map(email => email.trim()) : undefined,
      subject,
      body,
      attachments
    });
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    await saveDraft.mutateAsync({
      to: to ? to.split(',').map(email => email.trim()) : [],
      cc: cc ? cc.split(',').map(email => email.trim()) : [],
      bcc: bcc ? bcc.split(',').map(email => email.trim()) : [],
      subject: subject || '(No subject)',
      body
    });
  };

  const handleDiscard = () => {
    if (to || subject || body) {
      if (confirm('Are you sure you want to discard this email?')) {
        router.push('/mail/inbox');
      }
    } else {
      router.push('/mail/inbox');
    }
  };

  // Input field component for consistency
  const InputField = ({ label, value, onChange, placeholder }: any) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      borderBottom: `1px solid ${tokens.colors.gray100}`,
      padding: `${tokens.spacing.md} 0`
    }}>
      <label style={{
        fontSize: tokens.typography.sizes.sm,
        fontWeight: tokens.typography.weights.medium,
        color: tokens.colors.gray600,
        minWidth: '60px'
      }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: tokens.typography.sizes.sm,
          color: tokens.colors.charcoal,
          fontFamily: tokens.typography.fontFamily,
          backgroundColor: 'transparent',
          padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`
        }}
      />
    </div>
  );

  if (!gmailStatus?.connected) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: tokens.colors.gray50,
        fontFamily: tokens.typography.fontFamily
      }}>
        <div style={{
          textAlign: 'center',
          color: tokens.colors.gray500
        }}>
          <p>Please connect your Gmail account first</p>
          <motion.button
            onClick={() => router.push('/mail/settings')}
            style={{
              marginTop: tokens.spacing.lg,
              padding: `${tokens.spacing.sm} ${tokens.spacing.xl}`,
              backgroundColor: tokens.colors.evergreen,
              color: tokens.colors.white,
              border: 'none',
              borderRadius: tokens.radii.md,
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.medium,
              cursor: 'pointer'
            }}
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
          >
            Go to Settings
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: tokens.colors.gray50,
      fontFamily: tokens.typography.fontFamily
    }}>
      {/* Header */}
      <div style={{
        padding: tokens.spacing.lg,
        backgroundColor: tokens.colors.white,
        borderBottom: `1px solid ${tokens.colors.gray100}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.lg
        }}>
          <motion.button
            onClick={() => router.push('/mail/inbox')}
            style={{
              padding: tokens.spacing.sm,
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.colors.gray200}`,
              borderRadius: tokens.radii.md,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: tokens.transitions.fast
            }}
            whileHover={{ backgroundColor: tokens.colors.gray50 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={16} color={tokens.colors.gray600} strokeWidth={2} />
          </motion.button>
          <h1 style={{
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.semibold,
            color: tokens.colors.charcoal,
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Compose
          </h1>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing.sm
        }}>
          {lastSaved && (
            <span style={{
              fontSize: tokens.typography.sizes.xs,
              color: tokens.colors.gray500
            }}>
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <motion.button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
              backgroundColor: tokens.colors.white,
              color: tokens.colors.gray700,
              border: `1px solid ${tokens.colors.gray200}`,
              borderRadius: tokens.radii.md,
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.medium,
              cursor: isSavingDraft ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.sm,
              transition: tokens.transitions.fast
            }}
            whileHover={{ backgroundColor: isSavingDraft ? tokens.colors.white : tokens.colors.gray50 }}
            whileTap={{ scale: isSavingDraft ? 1 : 0.98 }}
          >
            {isSavingDraft ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={2} />
            ) : (
              <Save size={14} strokeWidth={2} />
            )}
            Save Draft
          </motion.button>
          <motion.button
            onClick={handleSend}
            disabled={isSending || !to || !subject}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
              backgroundColor: isSending || !to || !subject ? tokens.colors.gray300 : tokens.colors.evergreen,
              color: tokens.colors.white,
              border: 'none',
              borderRadius: tokens.radii.md,
              fontSize: tokens.typography.sizes.sm,
              fontWeight: tokens.typography.weights.medium,
              cursor: isSending || !to || !subject ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.sm,
              transition: tokens.transitions.fast
            }}
            whileHover={{ opacity: isSending || !to || !subject ? 1 : 0.9 }}
            whileTap={{ scale: isSending || !to || !subject ? 1 : 0.98 }}
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={2} />
            ) : (
              <Send size={14} strokeWidth={2} />
            )}
            Send
          </motion.button>
        </div>
      </div>

      {/* Compose Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: tokens.colors.white,
        marginTop: tokens.spacing.xl,
        borderRadius: tokens.radii.lg,
        boxShadow: tokens.shadows.md,
        overflow: 'hidden'
      }}>
        {/* Recipients */}
        <div style={{
          padding: `0 ${tokens.spacing.xl}`,
          borderBottom: `1px solid ${tokens.colors.gray100}`
        }}>
          <InputField
            label="To"
            value={to}
            onChange={setTo}
            placeholder="Recipients (comma separated)"
          />
          
          {!showCc && !showBcc && (
            <div style={{
              padding: `${tokens.spacing.sm} 0`,
              display: 'flex',
              gap: tokens.spacing.md
            }}>
              <button
                onClick={() => setShowCc(true)}
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  color: tokens.colors.gray500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Add Cc
              </button>
              <button
                onClick={() => setShowBcc(true)}
                style={{
                  fontSize: tokens.typography.sizes.xs,
                  color: tokens.colors.gray500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Add Bcc
              </button>
            </div>
          )}
          
          <AnimatePresence>
            {showCc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InputField
                  label="Cc"
                  value={cc}
                  onChange={setCc}
                  placeholder="Cc recipients"
                />
              </motion.div>
            )}
            
            {showBcc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InputField
                  label="Bcc"
                  value={bcc}
                  onChange={setBcc}
                  placeholder="Bcc recipients"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subject */}
        <div style={{
          padding: `0 ${tokens.spacing.xl}`,
          borderBottom: `1px solid ${tokens.colors.gray100}`
        }}>
          <InputField
            label="Subject"
            value={subject}
            onChange={setSubject}
            placeholder="Subject"
          />
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: tokens.spacing.xl,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: tokens.typography.sizes.sm,
              color: tokens.colors.charcoal,
              fontFamily: tokens.typography.fontFamily,
              lineHeight: tokens.typography.lineHeights.relaxed,
              resize: 'none',
              backgroundColor: 'transparent'
            }}
          />
        </div>

        {/* Bottom Toolbar */}
        <div style={{
          padding: tokens.spacing.lg,
          borderTop: `1px solid ${tokens.colors.gray100}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: tokens.colors.gray50
        }}>
          <div style={{
            display: 'flex',
            gap: tokens.spacing.xs
          }}>
            <motion.button
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.white }}
              whileTap={{ scale: 0.95 }}
            >
              <Bold size={14} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
            <motion.button
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.white }}
              whileTap={{ scale: 0.95 }}
            >
              <Italic size={14} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
            <motion.button
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.white }}
              whileTap={{ scale: 0.95 }}
            >
              <Link2 size={14} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
            <motion.button
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.white }}
              whileTap={{ scale: 0.95 }}
            >
              <List size={14} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
            <motion.button
              style={{
                padding: tokens.spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${tokens.colors.gray200}`,
                borderRadius: tokens.radii.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: tokens.transitions.fast,
                marginLeft: tokens.spacing.sm
              }}
              whileHover={{ backgroundColor: tokens.colors.white }}
              whileTap={{ scale: 0.95 }}
            >
              <Paperclip size={14} color={tokens.colors.gray600} strokeWidth={2} />
            </motion.button>
          </div>

          <motion.button
            onClick={handleDiscard}
            style={{
              padding: tokens.spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: tokens.transitions.fast
            }}
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={16} color={tokens.colors.gray500} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}