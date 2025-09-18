'use client'

import React, { useState, useEffect } from 'react'
import { useAuth, useUser, useOrganization } from '@clerk/nextjs'
import { 
  Hash, 
  Users, 
  Send,
  Search,
  Plus,
  Circle,
  Bell,
  Settings,
  ChevronDown,
  MoreVertical,
  Paperclip,
  AtSign,
  Lock,
  Volume2,
  Star,
  Pin,
  Edit3,
  Headphones,
  Video,
  Phone,
  Info
} from 'lucide-react'
import { ChatProvider, useChat } from '@/components/everchat/ChatProvider'
import MessageList from '@/components/everchat/MessageList'
import MessageInput from '@/components/everchat/MessageInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Channel {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unreadCount: number;
  lastMessage?: string;
  isPrivate?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <SlackStyleChat />
    </ChatProvider>
  );
}

function SlackStyleChat() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  
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
  } = useChat();

  // Mock channels for now - will be replaced with real data
  const channels: Channel[] = [
    { id: '1', name: 'general', type: 'channel', unreadCount: 0, isPinned: true },
    { id: '2', name: 'design-team', type: 'channel', unreadCount: 3 },
    { id: '3', name: 'engineering', type: 'channel', unreadCount: 0, isPrivate: true },
    { id: '4', name: 'random', type: 'channel', unreadCount: 0 },
    { id: '5', name: 'marketing', type: 'channel', unreadCount: 1 },
    { id: '6', name: 'product', type: 'channel', unreadCount: 0, isPrivate: true },
  ];

  // Handle channel selection
  const handleChannelSelect = (channelName: string) => {
    setSelectedChannel(channelName);
    // Find or create conversation for this channel
    const existingConv = conversations.find(c => 
      c.type === 'channel' && (c.name === `#${channelName}` || c.name === channelName)
    );
    
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create a conversation object for this channel
      setSelectedConversation({
        id: channelName,
        name: `#${channelName}`,
        type: 'channel',
        unreadCount: 0
      });
    }
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    await sendMessage(messageInput);
    setMessageInput('');
  };

  // Initialize with general channel on mount
  useEffect(() => {
    handleChannelSelect('general');
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - Clean, modern design matching evergreenOS aesthetic */}
      <div className="w-64 bg-white text-gray-900 flex flex-col h-full border-r border-gray-200">
        {/* Workspace Header - Clean, professional design */}
        <div className="px-4 py-3 border-b border-gray-700/30 hover:bg-gray-800/20 cursor-pointer transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1D5238] rounded-lg flex items-center justify-center font-semibold text-sm text-white">
                {organization?.name?.[0] || 'E'}
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-1">
                  {organization?.name || 'evergreenOS'}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </div>
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <Circle className="w-2 h-2 fill-[#10B981] text-[#10B981]" />
                  <span>{organizationMembers.length} members online</span>
                </div>
              </div>
            </div>
            <button className="p-1.5 hover:bg-gray-700/50 rounded-md transition-colors duration-200">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search evergreenOS" 
              className="w-full pl-9 pr-3 py-2 bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 text-sm font-medium focus:bg-white focus:border-[#1D5238] transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Channels Header */}
          <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer group transition-colors duration-200">
            <div className="flex items-center gap-1">
              <ChevronDown className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Channels</span>
            </div>
            <button 
              onClick={() => setShowNewChannelModal(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-gray-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Channel List */}
          <div className="space-y-0.5 mb-4">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.name)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-all duration-200 group ${
                  selectedChannel === channel.name 
                    ? 'bg-[#E6F4EC] text-[#1D5238] font-semibold' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {channel.isPrivate ? (
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span className="truncate">{channel.name}</span>
                </div>
                {channel.isPinned && <Pin className="w-3 h-3 text-gray-400" />}
                {channel.unreadCount > 0 && (
                  <span className="bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add Channel Button */}
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-gray-600 hover:text-[#1D5238] hover:bg-gray-50 text-sm font-medium transition-all duration-200 rounded-md">
            <Plus className="w-3.5 h-3.5" />
            <span>Add channels</span>
          </button>

          {/* Direct Messages Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mt-4 cursor-pointer group">
            <div className="flex items-center gap-1">
              <ChevronDown className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Direct Messages</span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Messages List - Show existing DM conversations first */}
          <div className="space-y-0.5">
            {/* Show existing DM conversations */}
            {conversations
              .filter(conv => conv.type === 'dm')
              .map((dm) => {
                const recipientId = dm.participants?.find(id => id !== user?.id);
                const isOnline = recipientId ? onlineUsers.has(recipientId) : false;
                const member = organizationMembers.find(m => m.userId === recipientId);
                const initials = member 
                  ? `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'UN'
                  : dm.name.split(' ').map(n => n[0]).join('').toUpperCase();
                
                return (
                  <button
                    key={dm.id}
                    onClick={() => setSelectedConversation(dm)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors duration-200 ${
                      selectedConversation?.id === dm.id
                        ? 'bg-[#E6F4EC] text-[#1D5238] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group`}
                  >
                    <div className="relative flex-shrink-0">
                      {member?.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={dm.name}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700">
                          {initials}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1A1D21] ${
                        isOnline ? 'bg-[#10B981]' : 'bg-gray-500'
                      }`} />
                    </div>
                    <span className="truncate flex-1 text-left">{dm.name}</span>
                    {dm.unreadCount > 0 && (
                      <span className="bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {dm.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            
            {/* Show members without conversations */}
            {organizationMembers
              .filter(member => {
                // Don't show current user
                if (member.userId === user?.id) return false;
                // Don't show if there's already a DM conversation
                const hasConversation = conversations.some(conv => 
                  conv.type === 'dm' && 
                  conv.participants?.includes(member.userId)
                );
                return !hasConversation;
              })
              .slice(0, 5)
              .map((member) => {
                const isOnline = onlineUsers.has(member.userId);
                const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'UN';
                const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
                
                return (
                  <button
                    key={member.userId}
                    onClick={() => createDMConversation(member.userId, name)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors duration-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group opacity-70"
                  >
                    <div className="relative flex-shrink-0">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={name}
                          className="w-5 h-5 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700">
                          {initials}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#1A1D21] ${
                        isOnline ? 'bg-[#10B981]' : 'bg-gray-500'
                      }`} />
                    </div>
                    <span className="truncate flex-1 text-left">{name}</span>
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-800/50 p-3">
          <button
            onClick={() => setShowUserProfile(!showUserProfile)}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-800/50 transition-colors duration-200"
          >
            <div className="relative">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || ''}
                  className="w-8 h-8 rounded-md object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-md bg-[#1D5238] flex items-center justify-center text-sm font-semibold">
                  {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'ME'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#1A1D21]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium">
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.emailAddresses?.[0]?.emailAddress}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                Active
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Channel Header */}
        <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {selectedConversation?.type === 'dm' ? (
                <Users className="w-4 h-4 text-gray-500" />
              ) : (
                <Hash className="w-4 h-4 text-gray-500" />
              )}
              <h2 className="font-semibold text-[#222B2E]">
                {selectedConversation?.name || selectedChannel}
              </h2>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors duration-200">
              <Star className="w-4 h-4 text-gray-400" />
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{organizationMembers.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <button className="text-sm text-[#6B7280] hover:text-[#222B2E] transition-colors duration-200">
              Add a description
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200">
              <Phone className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200">
              <Video className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200">
              <Info className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {selectedConversation ? (
            <>
              <MessageList />
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {selectedConversation.type === 'dm' ? (
                        <Users className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Hash className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-[#222B2E] mb-2">
                      {selectedConversation.type === 'dm' 
                        ? `Start a conversation with ${selectedConversation.name}`
                        : `Welcome to ${selectedConversation.name}`}
                    </h3>
                    <p className="text-gray-600">
                      {selectedConversation.type === 'dm'
                        ? 'Send a message to start your conversation.'
                        : `This is the very beginning of the ${selectedConversation.name} channel. Start a conversation to bring this channel to life!`}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-[#222B2E] mb-2">Welcome to #{selectedChannel}</h3>
                <p className="text-gray-600">
                  This is the very beginning of the #{selectedChannel} channel. 
                  Start a conversation to bring this channel to life!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:border-[#1D5238] bg-white transition-colors duration-200">
              <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                <Plus className="w-5 h-5" />
              </button>
              <input
                type="text"
                placeholder={
                  selectedConversation?.type === 'dm' 
                    ? `Message ${selectedConversation.name}`
                    : `Message ${selectedConversation?.name || `#${selectedChannel}`}`
                }
                className="flex-1 outline-none text-sm text-[#222B2E] placeholder-gray-400"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <AtSign className="w-4 h-4" />
                </button>
                <div className="h-5 w-px bg-gray-300 mx-1" />
                <button 
                  onClick={handleSendMessage}
                  className="px-3 py-1 bg-[#1D5238] hover:bg-[#1D5238]/90 text-white rounded-md text-sm font-medium transition-colors duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Thread/Profile) - Optional */}
      {showUserProfile && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#222B2E]">Profile</h3>
            <button 
              onClick={() => setShowUserProfile(false)}
              className="text-gray-400 hover:text-[#6B7280] transition-colors duration-200"
            >
              ×
            </button>
          </div>
          {/* Profile content here */}
        </div>
      )}
    </div>
  );
}