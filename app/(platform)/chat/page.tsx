'use client'

import React, { useState, useEffect } from 'react'
import { useAuth, useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Hash, 
  Users, 
  Send,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Activity,
  Sparkles,
  MessageCircle,
  UserPlus,
  Search,
  Plus,
  Circle,
  Bell
} from 'lucide-react'
import { ChatProvider, useChat } from '@/components/everchat/ChatProvider'
import MessageList from '@/components/everchat/MessageList'
import MessageInput from '@/components/everchat/MessageInput'

interface ChatStats {
  activeConversations: number;
  unreadMessages: number;
  avgResponseTime: number;
  teamMembers: number;
  messagesThisWeek: number;
  responseRate: number;
}

interface RecentThread {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type: 'channel' | 'dm';
  avatar?: string;
}

export default function ChatPage() {
  const { userId, orgId } = useAuth();
  const [stats, setStats] = useState<ChatStats>({
    activeConversations: 24,
    unreadMessages: 7,
    avgResponseTime: 12,
    teamMembers: 8,
    messagesThisWeek: 342,
    responseRate: 96
  });
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'channels' | 'messages'>('dashboard');
  const router = useRouter();

  useEffect(() => {
    loadRecentThreads();
  }, []);

  const loadRecentThreads = () => {
    // Sample data for demo
    setRecentThreads([
      {
        id: '1',
        name: 'general',
        lastMessage: 'Great work on the launch everyone! 🎉',
        timestamp: '2 min ago',
        unread: true,
        type: 'channel'
      },
      {
        id: '2',
        name: 'Sarah Chen',
        lastMessage: 'Can you review the Q3 marketing deck?',
        timestamp: '15 min ago',
        unread: true,
        type: 'dm'
      },
      {
        id: '3',
        name: 'engineering',
        lastMessage: 'Deployment complete for v2.3.1',
        timestamp: '1 hour ago',
        unread: false,
        type: 'channel'
      },
      {
        id: '4',
        name: 'Michael Rodriguez',
        lastMessage: 'Thanks for the quick response!',
        timestamp: '3 hours ago',
        unread: false,
        type: 'dm'
      }
    ]);
  };

  return (
    <ChatProvider>
      <ChatPageContent activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} recentThreads={recentThreads} />
    </ChatProvider>
  );
}

function ChatPageContent({ activeTab, setActiveTab, stats, recentThreads }: { 
  activeTab: 'dashboard' | 'channels' | 'messages';
  setActiveTab: (tab: 'dashboard' | 'channels' | 'messages') => void;
  stats: ChatStats;
  recentThreads: RecentThread[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvTab, setSelectedConvTab] = useState<'channels' | 'messages'>('channels');
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const { user } = useUser();
  const { organization } = useOrganization();
  const router = useRouter();
  
  const {
    messages,
    conversations,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    isLoading,
    isTyping,
    onlineUsers,
    organizationMembers,
    createDMConversation
  } = useChat()

  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    if (activeTab === 'channels') return conv.type === 'channel'
    return conv.type === 'dm'
  })

  // Get member info for a user ID
  const getMemberInfo = (userId: string) => {
    const member = organizationMembers.find(m => m.userId === userId)
    if (member) {
      return {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
        initials: `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'UN',
        avatar: member.imageUrl,
        isOnline: onlineUsers.has(userId)
      }
    }
    return {
      name: 'Unknown User',
      initials: 'UN',
      avatar: null,
      isOnline: false
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200" style={{padding: '16px 24px'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-[#1D5238]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-gray-900" style={{fontSize: '24px', fontWeight: 600}}>EverChat</h1>
                <span className="text-xs font-medium text-[#1D5238] bg-[#E6F4EC] px-2 py-1 rounded-full">Team Communication</span>
              </div>
              <p className="text-gray-600 text-sm">Real-time messaging with AI-powered search and smart notifications</p>
            </div>
          </div>
        </div>
      </div>
      {/* Tab Navigation */}
      <div style={{paddingLeft: '24px', paddingRight: '24px'}}>
        <div className="flex items-center" style={{gap: '4px', paddingTop: '24px'}}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'channels', label: 'Channels' },
            { key: 'messages', label: 'Direct Messages' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
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
                  <MessageCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.activeConversations}</div>
                <div className="text-gray-600 font-medium">Active conversations</div>
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
                <div className="text-4xl font-bold text-gray-900 mb-1">{stats.avgResponseTime}m</div>
                <div className="text-gray-600 font-medium">Avg response time</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3" style={{gap: '32px'}}>
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                  <Button variant="outline" className="text-sm">View All</Button>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {recentThreads.map((thread) => (
                    <div key={thread.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-start" style={{gap: '16px'}}>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          {thread.type === 'channel' ? (
                            <Hash className="h-6 w-6 text-gray-600" />
                          ) : (
                            <Users className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center" style={{gap: '8px', marginBottom: '8px'}}>
                            <h3 className="font-semibold text-gray-900">{thread.name}</h3>
                            <span className="text-sm text-gray-500">{thread.timestamp}</span>
                            {thread.unread && (
                              <div className="inline-block bg-[#1D5238] text-white text-xs font-medium rounded-full" style={{padding: '4px 8px'}}>New</div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm" style={{marginBottom: '12px'}}>{thread.lastMessage}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{thread.type === 'channel' ? 'Public Channel' : 'Direct Message'}</span>
                            <Button variant="outline" size="sm" className="text-xs">Open Chat</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Highlights & Quick Actions */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Team Highlights</h3>
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
                
                {/* Message Activity Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {[60, 82, 45, 90, 75, 40, 30].map((height, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className={index === 3 ? 'bg-[#1D5238]' : 'bg-gray-200'}
                          style={{
                            width: '100%',
                            height: `${height}px`,
                            borderRadius: '4px',
                            marginBottom: '4px'
                          }}
                        />
                        <div className="text-xs text-gray-500">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-gray-900">Peak day: Thursday</div>
                  <div className="text-xs text-gray-500">{stats.messagesThisWeek} messages this week</div>
                </div>
                
                {/* Quick Actions */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                  
                  <button 
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('channels')}
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="h-5 w-5 text-[#1D5238]" />
                      <span className="text-sm font-medium text-gray-900">Create Channel</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  <button 
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveTab('messages')}
                  >
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-[#1D5238]" />
                      <span className="text-sm font-medium text-gray-900">Start Direct Message</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  <button className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-[#1D5238]" />
                      <span className="text-sm font-medium text-gray-900">Notification Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* AI Insights */}
                <div className="mt-6 p-4 bg-[#E6F4EC] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#1D5238]" />
                    <h4 className="font-semibold text-[#1D5238]">AI Insights</h4>
                  </div>
                  <p className="text-sm text-[#1D5238]">
                    {stats.unreadMessages} unread messages need your attention. Most active channel today: #general with 42 messages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <ChannelsView />
        )}

        {activeTab === 'messages' && (
          <DirectMessagesView />
        )}
      </div>
    </div>
  );
}

// Channels View Component
function ChannelsView() {
  const { conversations, selectedConversation, setSelectedConversation } = useChat();
  const channelConversations = conversations.filter(c => c.type === 'channel');
  
  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
        <button
          className="w-full mb-4 bg-[#1D5238] hover:bg-[#2A7A52] text-white transition-colors duration-200 inline-flex items-center justify-center"
          style={{padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px'}}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Channel
        </button>
        
        <div className="space-y-2">
          {channelConversations.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No channels yet</p>
              <p className="text-gray-400 text-xs">Create your first channel to get started</p>
            </div>
          ) : (
            channelConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedConversation?.id === conversation.id 
                    ? 'bg-white border border-gray-200 shadow-sm' 
                    : 'hover:bg-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900 flex-1">{conversation.name}</span>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-[#1D5238] text-white text-xs px-2 py-1 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-xs text-gray-500 ml-6 truncate">
                    {conversation.lastMessage.text}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hash className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.name}</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <MessageList />
            </div>
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a channel</h3>
              <p className="text-gray-500">Choose a channel from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Direct Messages View Component  
function DirectMessagesView() {
  const { user } = useUser();
  const { 
    conversations, 
    selectedConversation, 
    setSelectedConversation,
    organizationMembers,
    onlineUsers,
    createDMConversation,
    isTyping
  } = useChat();
  
  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 p-4">
        <button
          className="w-full mb-4 bg-[#1D5238] hover:bg-[#2A7A52] text-white transition-colors duration-200 inline-flex items-center justify-center"
          style={{padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px'}}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          New Message
        </button>
        
        <div className="space-y-2">
          {organizationMembers
            .filter(member => member.userId !== user?.id)
            .map((member) => {
              const dmId = `dm-${[user?.id, member.userId].sort().join('-')}`;
              const conversation = conversations.find(c => c.id === dmId);
              const isOnline = onlineUsers.has(member.userId);
              
              return (
                <div
                  key={member.userId}
                  onClick={() => createDMConversation(member.userId, `${member.firstName} ${member.lastName}`.trim() || member.email)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedConversation?.id === dmId 
                      ? 'bg-white border border-gray-200 shadow-sm' 
                      : 'hover:bg-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.firstName || ''}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1D5238] text-white flex items-center justify-center text-xs font-semibold">
                          {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'UN'}
                        </div>
                      )}
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">
                          {`${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email}
                        </span>
                        {conversation?.unreadCount ? (
                          <span className="bg-[#1D5238] text-white text-xs px-2 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Circle className={`h-2 w-2 ${isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`} />
                        <span className="text-xs text-gray-500">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const otherUserId = selectedConversation.participants?.find(id => id !== user?.id) || '';
                  const member = organizationMembers.find(m => m.userId === otherUserId);
                  const isOnline = onlineUsers.has(otherUserId);
                  
                  if (!member) return <div>Unknown User</div>;
                  
                  return (
                    <>
                      <div className="relative">
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.firstName || ''}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#1D5238] text-white flex items-center justify-center text-sm font-semibold">
                            {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'UN'}
                          </div>
                        )}
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {`${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email}
                        </h3>
                        <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <MessageList />
            </div>
            
            {Object.entries(isTyping).some(([, typing]) => typing) && (
              <div className="px-4 py-2 text-xs text-gray-500 italic">
                {Object.entries(isTyping)
                  .filter(([, typing]) => typing)
                  .map(([userId]) => {
                    const member = organizationMembers.find(m => m.userId === userId);
                    return member ? `${member.firstName} ${member.lastName}`.trim() : 'Someone';
                  })
                  .join(', ')} is typing...
              </div>
            )}
            
            <MessageInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a team member to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}