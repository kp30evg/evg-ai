/**
 * Gmail Connection Status Component
 * Shows connection status without being annoying
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

interface GmailConnectionStatusProps {
  onConnect?: () => void;
  showOnlyIfDisconnected?: boolean;
}

export default function GmailConnectionStatus({ 
  onConnect,
  showOnlyIfDisconnected = true 
}: GmailConnectionStatusProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);
  
  // Check Gmail status
  const { data: gmailStatus, isLoading, refetch } = trpc.evermail.getGmailStatus.useQuery(
    undefined,
    { 
      // Cache for 5 minutes to avoid constant rechecking
      staleTime: 5 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      // Only refetch if we haven't shown the prompt yet
      enabled: !hasShownOnce || !isDismissed
    }
  );

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('gmail-connection-dismissed');
    const lastDismissed = localStorage.getItem('gmail-connection-dismissed-date');
    
    if (dismissed === 'true' && lastDismissed) {
      // Only respect dismissal for 24 hours
      const dismissedDate = new Date(lastDismissed);
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem('gmail-connection-dismissed');
        localStorage.removeItem('gmail-connection-dismissed-date');
      }
    }
    
    // Check if we've shown the prompt in this session
    const shownInSession = sessionStorage.getItem('gmail-prompt-shown');
    if (shownInSession === 'true') {
      setHasShownOnce(true);
    }
  }, []);

  // Mark as shown when status is loaded
  useEffect(() => {
    if (gmailStatus && !gmailStatus.connected && !hasShownOnce) {
      sessionStorage.setItem('gmail-prompt-shown', 'true');
      setHasShownOnce(true);
    }
  }, [gmailStatus, hasShownOnce]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('gmail-connection-dismissed', 'true');
    localStorage.setItem('gmail-connection-dismissed-date', new Date().toISOString());
  };

  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    } else {
      window.location.href = '/api/auth/gmail/connect?return=' + window.location.pathname;
    }
  };

  // Don't show if loading
  if (isLoading) return null;

  // Don't show if dismissed
  if (isDismissed) return null;

  // Don't show if connected and showOnlyIfDisconnected is true
  if (showOnlyIfDisconnected && gmailStatus?.connected) return null;

  // Don't show if we've already shown once in this session (unless explicitly not connected)
  if (hasShownOnce && gmailStatus?.connected !== false) return null;

  return (
    <AnimatePresence>
      {gmailStatus && !gmailStatus.connected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            maxWidth: '380px'
          }}
        >
          <div style={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    Connect Gmail for Full Features
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    margin: '2px 0 0 0'
                  }}>
                    One-time setup to enable email features
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={16} color="#6B7280" strokeWidth={2} />
              </button>
            </div>

            {/* Benefits */}
            <div style={{
              fontSize: '12px',
              color: '#4B5563',
              lineHeight: 1.5
            }}>
              Connect once to:
              <ul style={{
                margin: '4px 0 0 0',
                paddingLeft: '20px'
              }}>
                <li>Sync and manage emails</li>
                <li>Smart labels and organization</li>
                <li>Send emails from evergreenOS</li>
              </ul>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <motion.button
                onClick={handleConnect}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#1D5238',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mail size={16} strokeWidth={2} />
                Connect Gmail
              </motion.button>
              <button
                onClick={handleDismiss}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Later
              </button>
            </div>

            {/* Privacy note */}
            <p style={{
              fontSize: '11px',
              color: '#9CA3AF',
              margin: 0,
              textAlign: 'center'
            }}>
              Your data stays private and isolated to your account
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}