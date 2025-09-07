'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, Send, Inbox, FileText, Archive, Trash2, Star, Clock, TrendingUp, Users, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, Paperclip, AlertCircle, Sparkles, MailOpen, RefreshCw } from 'lucide-react';
import OAuthConnectionPrompt from '@/components/oauth/OAuthConnectionPrompt';
import { trpc } from '@/lib/trpc/client';

interface EmailStats {
  totalInbox: number;
  unread: number;
  sent: number;
  drafts: number;
  starred: number;
  responseRate: number;
  avgResponseTime: number;
}

interface EmailThread {
  id: string;
  subject: string;
  from: string;
  preview: string;
  date: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
  urgent: boolean;
}

export default function MailPage() {
  const { userId, orgId } = useAuth();
  const [stats, setStats] = useState<EmailStats>({
    totalInbox: 0,
    unread: 0,
    sent: 0,
    drafts: 0,
    starred: 0,
    responseRate: 0,
    avgResponseTime: 0
  });
  const [recentThreads, setRecentThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasGmailConnection, setHasGmailConnection] = useState(false);
  const [hasSyncedData, setHasSyncedData] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'sent' | 'drafts' | 'scheduled' | 'analytics'>('dashboard');
  const router = useRouter();

  // Check OAuth connection status
  const { data: oauthStatus, isLoading: checkingAuth, refetch: refetchOAuth } = trpc.oauth.checkConnection.useQuery(
    { service: 'gmail' },
    { 
      enabled: !!userId && !!orgId,
      refetchInterval: false,
      staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
      cacheTime: 1000 * 60 * 10 // Keep in cache for 10 minutes
    }
  );
  
  // Check Gmail sync status
  const { data: gmailStatus, refetch: refetchGmailStatus } = trpc.evermail.getGmailStatus.useQuery(
    undefined,
    { 
      enabled: !!userId && !!orgId,
      refetchInterval: false,
      staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
      cacheTime: 1000 * 60 * 10 // Keep in cache for 10 minutes
    }
  );

  // Refetch connection status when page becomes visible
  useEffect(() => {
    const handleFocus = () => {
      // Refetch connection status when user returns to the tab
      if (userId && orgId) {
        refetchOAuth();
        refetchGmailStatus();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId, orgId, refetchOAuth, refetchGmailStatus]);

  useEffect(() => {
    if (!checkingAuth && oauthStatus !== undefined && gmailStatus !== undefined) {
      if (oauthStatus?.connected || gmailStatus?.connected) {
        // User is connected (check both for redundancy)
        setHasGmailConnection(true);
        
        // Check if we have synced data
        if (gmailStatus?.emailCount && gmailStatus.emailCount > 0) {
          setHasSyncedData(true);
          loadRecentThreads();
          loadEmailStats();
        } else {
          // Connected but no data yet - could still be syncing or need to sync
          setHasSyncedData(false);
          // Don't redirect if we're already on the mail page, just show the interface
          // The user can manually trigger sync if needed
          loadRecentThreads();
          loadEmailStats();
        }
      } else {
        setHasGmailConnection(false);
        setHasSyncedData(false);
      }
      setIsLoading(false);
    }
  }, [oauthStatus, gmailStatus, checkingAuth]);

  const handleConnectGmail = () => {
    window.location.href = '/api/auth/gmail/connect?return=/mail';
  };

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/gmail/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sync successful:', data);
        
        // Reload the page data after sync
        await loadRecentThreads();
        await loadEmailStats();
        
        // Refetch status
        await refetchGmailStatus();
        
        // Show success message (you could add a toast notification here)
        alert(`Successfully synced ${data.totalSynced} emails from Gmail`);
      } else {
        const error = await response.json();
        console.error('Sync failed:', error);
        alert('Failed to sync emails: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert('Failed to sync emails. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadRecentThreads = async () => {
    try {
      // Load real email threads from Gmail
      const response = await fetch('/api/gmail/threads?limit=5');
      if (response.ok) {
        const data = await response.json();
        if (data.threads && data.threads.length > 0) {
          const formattedThreads = data.threads.map((thread: any) => ({
            id: thread.id,
            subject: thread.subject || '(no subject)',
            from: thread.from || 'Unknown sender',
            preview: thread.snippet || '',
            date: thread.date || 'Recently',
            unread: thread.unread || false,
            starred: thread.starred || false,
            hasAttachment: thread.hasAttachment || false,
            urgent: thread.important || false
          }));
          setRecentThreads(formattedThreads);
        } else {
          // If no emails, show empty state
          setRecentThreads([]);
        }
      }
    } catch (error) {
      console.error('Error loading email threads:', error);
      // On error, show empty state rather than mock data
      setRecentThreads([]);
    }
  };

  const loadEmailStats = async () => {
    try {
      // Load real stats from Gmail API
      const response = await fetch('/api/gmail/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalInbox: data.totalInbox || 0,
          unread: data.unread || 0,
          sent: data.sent || 0,
          drafts: data.drafts || 0,
          starred: data.starred || 0,
          responseRate: data.responseRate || 0,
          avgResponseTime: data.avgResponseTime || 0
        });
      }
    } catch (error) {
      console.error('Error loading email stats:', error);
      // Set to zero on error rather than fake data
      setStats({
        totalInbox: 0,
        unread: 0,
        sent: 0,
        drafts: 0,
        starred: 0,
        responseRate: 0,
        avgResponseTime: 0
      });
    }
  };

  // Show loading state while checking auth
  if (checkingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking connection status...</p>
        </div>
      </div>
    );
  }

  // Show connection prompt if not connected
  if (!hasGmailConnection) {
    return (
      <div className="min-h-screen bg-white">
        <OAuthConnectionPrompt 
          type="gmail" 
          onConnect={handleConnectGmail}
          userEmail={oauthStatus?.userEmail}
        />
      </div>
    );
  }

  // Main mail interface (only shown when connected)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200" style={{padding: '16px 24px'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-[#1D5238]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-gray-900" style={{fontSize: '24px', fontWeight: 600}}>EverMail</h1>
                <span className="text-xs font-medium text-[#1D5238] bg-[#E6F4EC] px-2 py-1 rounded-full">AI-Powered Email</span>
              </div>
              <p className="text-gray-600 text-sm">Smart filtering, instant search, and AI assistance for your inbox</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSyncEmails}
              disabled={isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Emails'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{paddingLeft: '24px', paddingRight: '24px'}}>
        <div className="flex items-center" style={{gap: '4px', paddingTop: '24px'}}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'inbox', label: 'Inbox' },
            { key: 'sent', label: 'Sent' },
            { key: 'drafts', label: 'Drafts' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'dashboard') {
                  setActiveTab('dashboard');
                } else if (tab.key === 'inbox') {
                  router.push('/mail/inbox');
                } else if (tab.key === 'sent') {
                  router.push('/mail/sent');
                } else if (tab.key === 'drafts') {
                  router.push('/mail/drafts');
                } else {
                  setActiveTab(tab.key as any);
                }
              }}
              className={`transition-colors ${
                activeTab === tab.key 
                  ? 'text-[#1D5238] bg-[#E6F4EC]' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: activeTab === tab.key ? 600 : 500,
                borderRadius: '8px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{padding: '24px'}}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{gap: '24px'}}>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Inbox className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.unread}</div>
                <div className="text-gray-600 font-medium">Unread emails</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.responseRate}%</div>
                <div className="text-gray-600 font-medium">Response rate</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.avgResponseTime}h</div>
                <div className="text-gray-600 font-medium">Avg response time</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3" style={{gap: '32px'}}>
              {/* Smart Filters */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Smart Filters</h2>
                  <Button variant="outline" className="text-sm">Customize</Button>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {[
                    { 
                      name: 'Important & Unread', 
                      count: Math.min(stats.unread, 10), 
                      desc: 'High-priority messages that need your attention right away.', 
                      color: 'red',
                      icon: AlertCircle,
                      trending: stats.unread > 5 
                    },
                    { 
                      name: 'From VIPs', 
                      count: stats.starred, 
                      desc: 'Messages from your most important contacts and key stakeholders.', 
                      color: 'yellow',
                      icon: Star
                    },
                    { 
                      name: 'Needs Response', 
                      count: Math.floor(stats.unread * 0.6), 
                      desc: 'Emails waiting for your reply, sorted by urgency and sender importance.', 
                      color: 'blue',
                      icon: MessageSquare
                    },
                    { 
                      name: 'All Messages', 
                      count: stats.totalInbox, 
                      desc: 'Your complete inbox including all messages.', 
                      color: 'gray',
                      icon: FileText
                    }
                  ].map((filter) => (
                    <div key={filter.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow cursor-pointer">
                      {filter.trending && (
                        <div className="inline-block bg-[#1D5238] text-white text-xs font-medium rounded-full" style={{padding: '4px 8px', marginBottom: '12px'}}>Needs Attention</div>
                      )}
                      <div className="flex items-start" style={{gap: '16px'}}>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <filter.icon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center" style={{gap: '8px', marginBottom: '8px'}}>
                            <h3 className="font-semibold text-gray-900">{filter.name}</h3>
                            <span className="text-sm text-gray-500">{filter.count}</span>
                          </div>
                          <p className="text-gray-600 text-sm" style={{marginBottom: '12px'}}>{filter.desc}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Updated just now</span>
                            <Button variant="outline" size="sm" className="text-xs">View All</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Activity */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Today's Activity</h3>
                  <div className="flex items-center" style={{gap: '8px'}}>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Today</span>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Email Activity Timeline */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['9am', '12pm', '3pm', '6pm'].map((time, index) => (
                      <div key={time} className="text-center">
                        <div className={`h-20 rounded-lg mb-2 ${
                          index === 0 ? 'bg-[#1D5238]' :
                          index === 1 ? 'bg-[#E6F4EC]' :
                          'bg-gray-100'
                        }`} style={{
                          height: index === 0 ? '80px' :
                                 index === 1 ? '60px' :
                                 index === 2 ? '40px' : '20px'
                        }}></div>
                        <div className="text-xs text-gray-600">{time}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-gray-900">Peak hours: 9-10 AM</div>
                  <div className="text-xs text-gray-500">32 emails received, 28 processed</div>
                </div>
                
                {/* Recent Threads */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Recent Threads</h4>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Inbox
                    </Button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {recentThreads.length > 0 ? (
                      recentThreads.slice(0, 3).map((thread) => (
                        <div key={thread.id} className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-600 w-16">{thread.date}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{thread.from} - {thread.subject}</div>
                            <div className="text-xs text-gray-500">{thread.preview.substring(0, 60)}...</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No recent emails yet. Sync in progress...</div>
                    )}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="mt-6 p-4 bg-[#E6F4EC] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#1D5238]" />
                    <h4 className="font-semibold text-[#1D5238]">AI Insights</h4>
                  </div>
                  <p className="text-sm text-[#1D5238]">
                    3 emails need urgent responses. Sarah Chen's email about Q3 strategy seems important based on your past interactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-[#222B2E] mb-2" style={{fontSize: '20px', fontWeight: 600}}>Inbox</h3>
            <p className="text-[#6B7280] mb-6" style={{fontSize: '16px'}}>Your intelligent inbox is being prepared...</p>
            <button 
              onClick={() => router.push('/mail/inbox')}
              className="bg-[#1D5238] hover:bg-[#2A7A52] text-white transition-colors duration-200 inline-flex items-center" 
              style={{padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px'}}
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Open Classic View
            </button>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sent Mail</h3>
            <p className="text-gray-600">View all your sent messages and track responses...</p>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Drafts</h3>
            <p className="text-gray-600">Continue working on your saved drafts...</p>
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scheduled</h3>
            <p className="text-gray-600">Manage your scheduled emails...</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Analytics</h3>
            <p className="text-gray-600">Detailed insights into your email patterns...</p>
          </div>
        )}
      </div>
    </div>
  );
}