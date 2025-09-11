'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Minimize2, Maximize2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import RichTextEditor from '@/components/mail/RichTextEditor';

// evergreenOS Design System Tokens (from style guide)
const tokens = {
  colors: {
    evergreen: '#1D5238',
    charcoal: '#222B2E',
    white: '#FFFFFF',
    gray500: '#6B7280',
    gray200: '#E5E7EB',
    gray100: '#F1F5F9',
    gray50: '#FAFBFC',
    softGreen: '#E6F4EC'
  },
  
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
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
    xl: '16px'
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 16px rgba(0, 0, 0, 0.06)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.08)',
    xl: '0 25px 70px rgba(0, 0, 0, 0.1)'
  },
  
  transitions: {
    fast: '150ms ease-out',
    base: '200ms ease-out'
  }
};

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
  isReply?: boolean;
  replyToId?: string;
}

export default function ComposeModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
  isReply = false,
  replyToId
}: ComposeModalProps) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [bodyHtml, setBodyHtml] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; id: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Memoize change handlers to prevent re-renders
  const handleToChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
  }, []);
  
  const handleCcChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCc(e.target.value);
  }, []);
  
  const handleBccChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBcc(e.target.value);
  }, []);
  
  const handleSubjectChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value);
  }, []);
  
  const handleEditorChange = React.useCallback((html: string, text: string) => {
    setBodyHtml(html);
    setBody(text);
  }, []);

  const handleAttachmentAdd = React.useCallback((files: File[]) => {
    const newAttachments = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleAttachmentRemove = React.useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const sendEmail = trpc.evermail.sendEmail.useMutation({
    onSuccess: () => {
      onClose();
      // Reset form
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
    },
    onError: (error) => {
      setIsSending(false);
      
      // Check if it's a Gmail authentication error
      if (error.message?.includes('session has expired') || 
          error.message?.includes('reconnect')) {
        if (confirm(error.message + '\n\nWould you like to reconnect your Gmail account now?')) {
          window.location.href = '/mail/settings';
        }
      } else {
        alert(error.message || 'Failed to send email. Please try again.');
      }
    }
  });
  
  const saveDraft = trpc.evermail.saveDraft.useMutation({
    onSuccess: () => {
      alert('Draft saved successfully!');
    },
    onError: (error) => {
      alert(`Failed to save draft: ${error.message}`);
    }
  });

  const handleSend = () => {
    if (!to || !subject || !body) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    sendEmail.mutate({
      to: to.split(',').map(email => email.trim()),
      cc: cc ? cc.split(',').map(email => email.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map(email => email.trim()) : undefined,
      subject,
      body: bodyHtml || body,
      replyToId
    });
    setIsSending(false);
  };
  
  const handleSaveDraft = () => {
    saveDraft.mutate({
      to: to ? to.split(',').map(email => email.trim()) : [],
      cc: cc ? cc.split(',').map(email => email.trim()) : [],
      bcc: bcc ? bcc.split(',').map(email => email.trim()) : [],
      subject: subject || '(No subject)',
      body: body || ''
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: 'fixed',
          bottom: isMinimized ? '0' : tokens.spacing.xl,
          right: tokens.spacing.xl,
          width: isMinimized ? '320px' : '680px',
          maxWidth: '90vw',
          height: isMinimized ? 'auto' : '650px',
          maxHeight: '85vh',
          backgroundColor: tokens.colors.white,
          borderRadius: tokens.radii.xl,
          boxShadow: tokens.shadows.xl,
          border: `1px solid ${tokens.colors.gray200}`,
          zIndex: 1000,
          overflow: 'hidden',
          transition: tokens.transitions.base,
          fontFamily: tokens.typography.fontFamily,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
          borderBottom: `1px solid ${tokens.colors.gray200}`,
          backgroundColor: tokens.colors.gray50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: tokens.typography.sizes.lg,
            fontWeight: tokens.typography.weights.semibold,
            color: tokens.colors.charcoal,
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            {isReply ? 'Reply' : 'New Message'}
          </h3>
          <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
            <motion.button
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                padding: tokens.spacing.sm,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: tokens.colors.gray500,
                borderRadius: tokens.radii.sm,
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.gray100 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMinimized ? <Maximize2 size={16} strokeWidth={2} /> : <Minimize2 size={16} strokeWidth={2} />}
            </motion.button>
            <motion.button
              onClick={onClose}
              style={{
                padding: tokens.spacing.sm,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: tokens.colors.gray500,
                borderRadius: tokens.radii.sm,
                transition: tokens.transitions.fast
              }}
              whileHover={{ backgroundColor: tokens.colors.gray100 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={16} strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Recipients */}
            <div style={{ padding: `${tokens.spacing.xl} ${tokens.spacing.xl} ${tokens.spacing.lg}`, borderBottom: `1px solid ${tokens.colors.gray200}` }}>
              <div style={{ marginBottom: tokens.spacing.lg }}>
                <input
                  type="email"
                  placeholder="To"
                  value={to}
                  onChange={handleToChange}
                  style={{
                    width: '100%',
                    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                    border: `2px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.lg,
                    fontSize: tokens.typography.sizes.base,
                    fontFamily: tokens.typography.fontFamily,
                    outline: 'none',
                    transition: tokens.transitions.fast,
                    backgroundColor: tokens.colors.white
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = tokens.colors.evergreen;
                    e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.softGreen}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = tokens.colors.gray200;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              {showCc && (
                <>
                  <div style={{ marginBottom: tokens.spacing.lg }}>
                    <input
                      type="email"
                      placeholder="Cc"
                      value={cc}
                      onChange={handleCcChange}
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                        border: `2px solid ${tokens.colors.gray200}`,
                        borderRadius: tokens.radii.lg,
                        fontSize: tokens.typography.sizes.base,
                        fontFamily: tokens.typography.fontFamily,
                        outline: 'none',
                        transition: tokens.transitions.fast,
                        backgroundColor: tokens.colors.white
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = tokens.colors.evergreen;
                        e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.softGreen}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tokens.colors.gray200;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: tokens.spacing.lg }}>
                    <input
                      type="email"
                      placeholder="Bcc"
                      value={bcc}
                      onChange={handleBccChange}
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                        border: `2px solid ${tokens.colors.gray200}`,
                        borderRadius: tokens.radii.lg,
                        fontSize: tokens.typography.sizes.base,
                        fontFamily: tokens.typography.fontFamily,
                        outline: 'none',
                        transition: tokens.transitions.fast,
                        backgroundColor: tokens.colors.white
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = tokens.colors.evergreen;
                        e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.softGreen}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = tokens.colors.gray200;
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </>
              )}
              
              {!showCc && (
                <motion.button
                  onClick={() => setShowCc(true)}
                  style={{
                    fontSize: tokens.typography.sizes.sm,
                    fontWeight: tokens.typography.weights.medium,
                    color: tokens.colors.evergreen,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: `${tokens.spacing.xs} 0`,
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ color: tokens.colors.charcoal }}
                >
                  Add Cc/Bcc
                </motion.button>
              )}
              
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={handleSubjectChange}
                style={{
                  width: '100%',
                  padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                  border: `2px solid ${tokens.colors.gray200}`,
                  borderRadius: tokens.radii.lg,
                  fontSize: tokens.typography.sizes.base,
                  fontFamily: tokens.typography.fontFamily,
                  fontWeight: tokens.typography.weights.medium,
                  outline: 'none',
                  marginTop: tokens.spacing.lg,
                  transition: tokens.transitions.fast,
                  backgroundColor: tokens.colors.white
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = tokens.colors.evergreen;
                  e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.softGreen}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = tokens.colors.gray200;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Body */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '250px',
              maxHeight: 'calc(100% - 240px)',
              overflow: 'auto'
            }}>
              <RichTextEditor
                value={bodyHtml || body}
                onChange={handleEditorChange}
                placeholder="Write your message..."
                onAttachmentAdd={handleAttachmentAdd}
                attachments={attachments}
                onAttachmentRemove={handleAttachmentRemove}
              />
            </div>

            {/* Footer */}
            <div style={{
              padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
              borderTop: `1px solid ${tokens.colors.gray200}`,
              backgroundColor: tokens.colors.gray50,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
                <motion.button
                  onClick={handleSaveDraft}
                  style={{
                    padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                    background: 'transparent',
                    border: `1px solid ${tokens.colors.gray200}`,
                    borderRadius: tokens.radii.md,
                    cursor: 'pointer',
                    color: tokens.colors.gray500,
                    fontSize: tokens.typography.sizes.sm,
                    fontWeight: tokens.typography.weights.medium,
                    fontFamily: tokens.typography.fontFamily,
                    transition: tokens.transitions.fast
                  }}
                  whileHover={{ 
                    backgroundColor: tokens.colors.gray50,
                    borderColor: tokens.colors.evergreen,
                    color: tokens.colors.evergreen 
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Save Draft
                </motion.button>
              </div>
              
              <motion.button
                onClick={handleSend}
                disabled={isSending}
                whileHover={{ 
                  scale: isSending ? 1 : 1.02,
                  backgroundColor: isSending ? tokens.colors.evergreen : tokens.colors.evergreen,
                  transform: isSending ? 'none' : 'translateY(-1px)',
                  boxShadow: isSending ? tokens.shadows.sm : tokens.shadows.md
                }}
                whileTap={{ scale: isSending ? 1 : 0.98 }}
                style={{
                  padding: `${tokens.spacing.md} ${tokens.spacing['2xl']}`,
                  backgroundColor: tokens.colors.evergreen,
                  color: tokens.colors.white,
                  border: 'none',
                  borderRadius: tokens.radii.md,
                  fontSize: tokens.typography.sizes.sm,
                  fontWeight: tokens.typography.weights.semibold,
                  fontFamily: tokens.typography.fontFamily,
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  boxShadow: tokens.shadows.sm,
                  transition: tokens.transitions.fast
                }}
              >
                <Send size={16} strokeWidth={2} />
                {isSending ? 'Sending...' : 'Send'}
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}