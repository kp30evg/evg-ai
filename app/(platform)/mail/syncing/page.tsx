'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Calendar, CheckCircle, Loader2, Inbox, Send, Users, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function SyncingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const returnUrl = searchParams.get('return') || '/mail';
  
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'complete' | 'error'>('syncing');
  const [progress, setProgress] = useState(0);
  const [emailCount, setEmailCount] = useState(0);
  const [calendarCount, setCalendarCount] = useState(0);
  const [syncStarted, setSyncStarted] = useState(false);
  
  // Poll for sync status
  const { data: gmailStatus, refetch } = trpc.evermail.getGmailStatus.useQuery(
    undefined,
    { 
      refetchInterval: 2000, // Check every 2 seconds
      enabled: syncStatus === 'syncing'
    }
  );
  
  // Trigger sync on mount
  useEffect(() => {
    if (!syncStarted) {
      setSyncStarted(true);
      
      // Trigger Gmail sync
      fetch('/api/gmail/sync', { method: 'POST' })
        .then(res => res.json())
        .then(result => {
          console.log('Gmail sync triggered:', result);
          if (result.success) {
            setEmailCount(result.totalSynced || 0);
          }
        })
        .catch(error => {
          console.error('Failed to trigger Gmail sync:', error);
        });
      
      // If coming from calendar page, also trigger calendar sync
      if (returnUrl.includes('/calendar')) {
        fetch('/api/calendar/google/sync', { method: 'POST' })
          .then(res => res.json())
          .then(result => {
            console.log('Calendar sync triggered:', result);
            if (result.success) {
              setCalendarCount(result.totalSynced || 0);
            }
          })
          .catch(error => {
            console.error('Failed to trigger calendar sync:', error);
          });
      }
    }
  }, [syncStarted, returnUrl]);
  
  useEffect(() => {
    // Check if sync has completed successfully
    if (gmailStatus?.emailCount && gmailStatus.emailCount > 0) {
      setEmailCount(gmailStatus.emailCount);
      
      // If we have emails, sync is complete
      if (gmailStatus.emailCount >= 10) {
        setProgress(100);
        setSyncStatus('complete');
        
        // Redirect immediately when sync is complete
        setTimeout(() => {
          router.push(returnUrl);
        }, 1500);
      } else {
        // Still syncing, show progress
        setProgress(Math.min(75, (gmailStatus.emailCount / 50) * 100));
      }
    }
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 800);
    
    // Maximum wait time before redirect (in case sync is slow)
    const maxWaitTimeout = setTimeout(() => {
      setSyncStatus('complete');
      setProgress(100);
      
      // Force redirect after max wait time
      setTimeout(() => {
        router.push(returnUrl);
      }, 1000);
    }, 20000); // 20 seconds max wait
    
    return () => {
      clearInterval(progressInterval);
      clearTimeout(maxWaitTimeout);
    };
  }, [gmailStatus, router, returnUrl]);
  
  const syncSteps = [
    { icon: Mail, label: 'Connecting to Gmail', complete: progress > 0 },
    { icon: Inbox, label: 'Syncing inbox messages', complete: progress > 25 },
    { icon: Send, label: 'Loading sent items', complete: progress > 50 },
    { icon: Calendar, label: 'Syncing calendar events', complete: progress > 75 },
    { icon: Users, label: 'Extracting contacts', complete: progress > 90 }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="w-20 h-20 bg-emerald-100 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            animate={{ rotate: syncStatus === 'syncing' ? 360 : 0 }}
            transition={{ duration: 2, repeat: syncStatus === 'syncing' ? Infinity : 0, ease: "linear" }}
          >
            {syncStatus === 'complete' ? (
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            ) : (
              <Mail className="w-10 h-10 text-emerald-600" />
            )}
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {syncStatus === 'complete' ? 'Sync Complete!' : 'Syncing Your Data'}
          </h1>
          
          <p className="text-lg text-gray-600">
            {syncStatus === 'complete' 
              ? `Successfully imported ${emailCount} emails and ${calendarCount} calendar events`
              : `We're importing your emails and calendar from ${email}`
            }
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">{progress}% complete</p>
        </div>
        
        {/* Sync Steps */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          {syncSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                  ${step.complete 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {step.complete && syncStatus === 'syncing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${step.complete ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
                
                {step.complete && syncStatus === 'complete' && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-emerald-50 rounded-xl"
        >
          <h3 className="font-semibold text-emerald-900 mb-2">
            🔒 Your data is secure
          </h3>
          <p className="text-sm text-emerald-700">
            We use industry-standard encryption to protect your information. 
            Only you can access your emails and calendar events within your workspace.
          </p>
        </motion.div>
        
        {syncStatus === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              There was an issue syncing your data. Please try again or contact support.
            </p>
            <button
              onClick={() => router.push('/mail/settings')}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Settings
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}