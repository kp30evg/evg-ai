'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, Send, Inbox, FileText, Archive, Trash2, Star, Clock, TrendingUp, Users, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, Paperclip, AlertCircle, Sparkles, MailOpen } from 'lucide-react';

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
    totalInbox: 247,
    unread: 12,
    sent: 89,
    drafts: 3,
    starred: 8,
    responseRate: 94,
    avgResponseTime: 2.3
  });
  const [recentThreads, setRecentThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'sent' | 'drafts' | 'scheduled' | 'analytics'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    loadRecentThreads();
  }, []);

  const loadRecentThreads = () => {
    // Sample data for demo
    setRecentThreads([
      {
        id: '1',
        subject: 'Q3 Marketing Strategy Review',
        from: 'Sarah Chen',
        preview: "I've reviewed the latest metrics and I think we should discuss our approach for the upcoming quarter...",
        date: '10:30 AM',
        unread: true,
        starred: true,
        hasAttachment: true,
        urgent: false
      },
      {
        id: '2',
        subject: 'Project Apollo - Status Update',
        from: 'Michael Rodriguez',
        preview: "Great progress this week! The team has completed the initial prototype and we're ready for testing...",
        date: '9:15 AM',
        unread: true,
        starred: false,
        hasAttachment: false,
        urgent: true
      },
      {
        id: '3',
        subject: 'Re: Partnership Proposal',
        from: 'Emily Watson',
        preview: "Thank you for sending over the proposal. I've shared it with our executive team and we're very interested...",
        date: 'Yesterday',
        unread: false,
        starred: false,
        hasAttachment: true,
        urgent: false
      },
      {
        id: '4',
        subject: 'Weekly Team Sync Notes',
        from: 'David Park',
        preview: "Here are the action items from today's sync: 1) Complete user research by Friday 2) Review designs...",
        date: 'Yesterday',
        unread: false,
        starred: true,
        hasAttachment: false,
        urgent: false
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200" style={{padding: '32px'}}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#1D5238] rounded-lg flex items-center justify-center">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-[#1D5238] bg-[#E6F4EC] px-3 py-1 rounded-full">AI-Powered Email</span>
        </div>
        <h1 className="text-[#222B2E] mb-2" style={{fontSize: '48px', lineHeight: '52px', fontWeight: 700, letterSpacing: '-0.02em'}}>
          Your Inbox, <span style={{color: '#1D5238'}}>Simplified.</span>
        </h1>
        <p className="text-[#6B7280]" style={{fontSize: '18px', lineHeight: '28px', maxWidth: '800px'}}>
          Experience email that works as fast as you do. Smart filtering, instant search, and AI assistance to help you stay on top of what matters.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{paddingLeft: '32px', paddingRight: '32px'}}>
        <div className="flex items-center" style={{gap: '8px', paddingTop: '32px', paddingBottom: '32px'}}>
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
              className={`transition-all duration-200 ${
                activeTab === tab.key 
                  ? 'bg-[#1D5238] text-white' 
                  : 'text-[#6B7280] hover:text-[#222B2E] hover:bg-gray-50'
              }`}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: activeTab === tab.key ? 600 : 500,
                borderRadius: '8px',
                border: 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{padding: '32px'}}>
        {activeTab === 'dashboard' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '48px'}}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{gap: '32px'}}>
              <div className="bg-white rounded-xl p-6" style={{border: '1px solid rgba(229, 231, 235, 0.6)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'}}>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Inbox className="h-6 w-6 text-[#6B7280]" />
                </div>
                <div className="text-[#222B2E] mb-1" style={{fontSize: '36px', lineHeight: '40px', fontWeight: 700}}>{stats.unread}</div>
                <div className="text-[#6B7280]" style={{fontSize: '14px', fontWeight: 500}}>Unread emails</div>
              </div>
              
              <div className="bg-white rounded-xl p-6" style={{border: '1px solid rgba(229, 231, 235, 0.6)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'}}>
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-[#222B2E] mb-1" style={{fontSize: '36px', lineHeight: '40px', fontWeight: 700}}>{stats.responseRate}%</div>
                <div className="text-[#6B7280]" style={{fontSize: '14px', fontWeight: 500}}>Response rate</div>
              </div>
              
              <div className="bg-white rounded-xl p-6" style={{border: '1px solid rgba(229, 231, 235, 0.6)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'}}>
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-[#222B2E] mb-1" style={{fontSize: '36px', lineHeight: '40px', fontWeight: 700}}>{stats.avgResponseTime}h</div>
                <div className="text-[#6B7280]" style={{fontSize: '14px', fontWeight: 500}}>Avg response time</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3" style={{gap: '48px'}}>
              {/* Smart Filters */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[#222B2E]" style={{fontSize: '24px', lineHeight: '28px', fontWeight: 600}}>Smart Filters</h2>
                  <button className="text-[#1D5238] bg-white hover:bg-[#E6F4EC] transition-colors duration-200" style={{padding: '8px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: '1px solid #E5E7EB'}}>Customize</button>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                  {[
                    { 
                      name: 'Important & Unread', 
                      count: 8, 
                      desc: 'High-priority messages that need your attention right away.', 
                      color: 'red',
                      icon: AlertCircle,
                      trending: true 
                    },
                    { 
                      name: 'From VIPs', 
                      count: 3, 
                      desc: 'Messages from your most important contacts and key stakeholders.', 
                      color: 'yellow',
                      icon: Star
                    },
                    { 
                      name: 'Needs Response', 
                      count: 12, 
                      desc: 'Emails waiting for your reply, sorted by urgency and sender importance.', 
                      color: 'blue',
                      icon: MessageSquare
                    },
                    { 
                      name: 'Newsletters & Updates', 
                      count: 34, 
                      desc: 'Subscriptions and automated emails for when you have time.', 
                      color: 'gray',
                      icon: FileText
                    }
                  ].map((filter) => (
                    <div key={filter.name} className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer" style={{border: '1px solid rgba(229, 231, 235, 0.6)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'}}>
                      {filter.trending && (
                        <div className="inline-block bg-[#1D5238] text-white text-xs font-medium rounded-full" style={{padding: '4px 8px', marginBottom: '12px'}}>
                          Needs Attention
                        </div>
                      )}
                      <div className="flex items-start" style={{gap: '16px'}}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          filter.color === 'red' ? 'bg-red-100' :
                          filter.color === 'yellow' ? 'bg-yellow-100' :
                          filter.color === 'blue' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <filter.icon className={`h-6 w-6 ${
                            filter.color === 'red' ? 'text-red-600' :
                            filter.color === 'yellow' ? 'text-yellow-600' :
                            filter.color === 'blue' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center" style={{gap: '8px', marginBottom: '8px'}}>
                            <h3 className="font-semibold text-[#222B2E]" style={{fontSize: '16px'}}>{filter.name}</h3>
                            <span className="text-sm font-medium text-[#6B7280] bg-gray-100 px-2 py-1 rounded-full">
                              {filter.count}
                            </span>
                          </div>
                          <p className="text-[#6B7280] text-sm" style={{marginBottom: '12px', lineHeight: '20px'}}>{filter.desc}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Updated just now</span>
                            <button className="text-[#1D5238] hover:bg-[#E6F4EC] transition-colors duration-200" style={{padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', border: '1px solid #E5E7EB'}}>View All</button>
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
                  <h3 className="text-[#222B2E]" style={{fontSize: '20px', lineHeight: '24px', fontWeight: 600}}>Today's Activity</h3>
                  <div className="flex items-center" style={{gap: '8px'}}>
                    <button className="hover:bg-gray-50 transition-colors duration-200" style={{width: '32px', height: '32px', padding: 0, borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <ChevronLeft className="h-4 w-4 text-[#6B7280]" />
                    </button>
                    <span className="text-sm font-medium text-[#222B2E]">Today</span>
                    <button className="hover:bg-gray-50 transition-colors duration-200" style={{width: '32px', height: '32px', padding: 0, borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                    </button>
                  </div>
                </div>
                
                {/* Email Activity Timeline */}
                <div className="bg-white rounded-xl p-6 mb-6" style={{border: '1px solid rgba(229, 231, 235, 0.6)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'}}>
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
                  <div className="text-sm font-medium text-[#222B2E]">Peak hours: 9-10 AM</div>
                  <div className="text-xs text-[#6B7280]">32 emails received, 28 processed</div>
                </div>
                
                {/* Recent Threads */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#222B2E]" style={{fontSize: '16px'}}>Recent Threads</h4>
                    <button className="text-[#1D5238] hover:bg-[#E6F4EC] transition-colors duration-200" style={{padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '6px', border: '1px solid #E5E7EB'}}>
                      View Inbox
                    </button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {recentThreads.slice(0, 3).map((thread) => (
                      <div key={thread.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {thread.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <div className="font-medium text-sm text-[#222B2E]">{thread.from}</div>
                            {thread.urgent && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-[#222B2E] mb-1">{thread.subject}</div>
                          <div className="text-xs text-[#6B7280] line-clamp-1">{thread.preview}</div>
                        </div>
                        <div className="text-xs text-[#6B7280]">{thread.date}</div>
                      </div>
                    ))}
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