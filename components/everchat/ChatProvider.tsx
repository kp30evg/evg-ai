'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useUser, useOrganization, useOrganizationList } from '@clerk/nextjs'
import { getPusherClient, channels, events } from '@/lib/pusher'
import { trpc } from '@/lib/trpc/client'
import type { Channel, PresenceChannel } from 'pusher-js'

interface Message {
  id: string
  text: string
  userId: string
  userName: string
  userImage?: string
  timestamp: Date
  channelId: string
  threadId?: string
  mentions?: string[]
  attachments?: string[]
  aiCommand?: boolean
  commandResult?: any
}

interface Conversation {
  id: string
  name: string
  type: 'channel' | 'dm'
  participants?: string[]
  lastMessage?: Message
  unreadCount: number
  isOnline?: boolean
}

interface OrganizationMember {
  id: string
  userId: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string | null
  role: string
}

interface ChatContextType {
  messages: Message[]
  conversations: Conversation[]
  selectedConversation: Conversation | null
  setSelectedConversation: (conversation: Conversation | null) => void
  sendMessage: (text: string) => Promise<void>
  isLoading: boolean
  isTyping: Record<string, boolean>
  onlineUsers: Set<string>
  organizationMembers: OrganizationMember[]
  createDMConversation: (recipientId: string, recipientName: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const { organization } = useOrganization()
  const { organizationList } = useOrganizationList({
    organizationList: organization ? [organization] : []
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([])
  const [pusherClient, setPusherClient] = useState<any>(null)
  const [activeChannels, setActiveChannels] = useState<Map<string, Channel>>(new Map())
  
  // tRPC mutations and queries
  const sendMessageMutation = trpc.everchat.sendMessage.useMutation()
  const getMessagesQuery = trpc.everchat.getMessages.useQuery(
    { 
      channelId: selectedConversation?.id || '',
      limit: 50 
    },
    { 
      enabled: !!selectedConversation,
      refetchOnWindowFocus: false
    }
  )

  // Initialize Pusher for real-time messaging
  useEffect(() => {
    if (!organization?.id || !user?.id) return

    const client = getPusherClient(user.id, organization.id)
    
    // If Pusher is not configured, skip initialization
    if (!client) {
      console.warn('Pusher not configured - chat will work without real-time updates')
      return
    }
    
    setPusherClient(client)

    // Subscribe to organization general channel
    const generalChannel = client.subscribe(channels.orgGeneral(organization.id))
    
    // Subscribe to organization-wide presence channel for online status
    const presenceChannel = client.subscribe(channels.orgPresence(organization.id)) as PresenceChannel
    
    // Handle new messages in general channel
    generalChannel.bind(events.MESSAGE_NEW, (data: Message) => {
      setMessages(prev => [...prev, data])
    })

    // Handle channel creation
    generalChannel.bind(events.CHANNEL_CREATED, (data: any) => {
      // Update conversations list when new channel is created
      setConversations(prev => [...prev, {
        id: data.id,
        name: data.name,
        type: 'channel',
        unreadCount: 0
      }])
    })

    // Handle presence events
    presenceChannel.bind(events.MEMBER_ADDED, (member: any) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.add(member.id)
        return newSet
      })
    })

    presenceChannel.bind(events.MEMBER_REMOVED, (member: any) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(member.id)
        return newSet
      })
    })

    // Get initial online members when subscription succeeds
    presenceChannel.bind(events.SUBSCRIPTION_SUCCEEDED, (members: any) => {
      const onlineIds = Object.keys(members.members)
      setOnlineUsers(new Set(onlineIds))
    })

    // Store channels for cleanup
    setActiveChannels(prev => {
      const newMap = new Map(prev)
      newMap.set('general', generalChannel)
      newMap.set('presence', presenceChannel)
      return newMap
    })

    return () => {
      generalChannel.unbind_all()
      generalChannel.unsubscribe()
      presenceChannel.unbind_all()
      presenceChannel.unsubscribe()
      client.disconnect()
    }
  }, [organization?.id, user?.id])

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization?.id) return
      
      try {
        // Fetch organization members using Clerk's API
        const response = await fetch(`/api/organization/members`)
        if (response.ok) {
          const members = await response.json()
          setOrganizationMembers(members)
          
          // Create DM conversations for each member
          const dmConversations = members
            .filter((member: any) => member.userId !== user?.id)
            .map((member: any) => ({
              id: `dm-${[user?.id, member.userId].sort().join('-')}`,
              name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
              type: 'dm' as const,
              unreadCount: 0,
              isOnline: false,
              participants: [user?.id, member.userId]
            }))
          
          setConversations(prev => {
            // Keep channels, update DMs
            const channels = prev.filter(c => c.type === 'channel')
            return [...channels, ...dmConversations]
          })
        }
      } catch (error) {
        console.error('Failed to fetch organization members:', error)
      }
    }
    
    fetchMembers()
  }, [organization?.id, user?.id])

  // Load initial conversations and messages
  useEffect(() => {
    if (!organization?.id) return

    // Load initial channels (not DMs - those come from members)
    const channelConversations: Conversation[] = [
      {
        id: 'general',
        name: '#general',
        type: 'channel',
        unreadCount: 0,
        lastMessage: {
          id: '1',
          text: 'Welcome to evergreenOS!',
          userId: 'system',
          userName: 'System',
          timestamp: new Date(),
          channelId: 'general'
        }
      },
      {
        id: 'sales',
        name: '#sales',
        type: 'channel',
        unreadCount: 0,
        lastMessage: {
          id: '2',
          text: 'Discuss sales strategies here',
          userId: 'system',
          userName: 'System',
          timestamp: new Date(Date.now() - 3600000),
          channelId: 'sales'
        }
      },
      {
        id: 'engineering',
        name: '#engineering',
        type: 'channel',
        unreadCount: 0
      }
    ]

    setConversations(prev => {
      // Keep DMs, update channels
      const dms = prev.filter(c => c.type === 'dm')
      return [...channelConversations, ...dms]
    })
  }, [organization?.id, user?.id])

  // Subscribe to selected conversation channel
  useEffect(() => {
    if (!selectedConversation || !pusherClient || !organization?.id || !user?.id) return

    // Subscribe to the specific channel
    const channelName = selectedConversation.type === 'channel' 
      ? channels.channel(organization.id, selectedConversation.id)
      : channels.dm(organization.id, user.id, selectedConversation.id.replace('dm-', '').split('-').find(id => id !== user.id) || '')
    
    const conversationChannel = pusherClient.subscribe(channelName)
    
    // Handle messages in this channel
    conversationChannel.bind(events.MESSAGE_NEW, (data: Message) => {
      setMessages(prev => [...prev, data])
    })
    
    // Handle typing indicators
    conversationChannel.bind(events.USER_TYPING, (data: { userId: string, userName: string }) => {
      if (data.userId !== user.id) {
        setIsTyping(prev => ({ ...prev, [data.userId]: true }))
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setIsTyping(prev => ({ ...prev, [data.userId]: false }))
        }, 3000)
      }
    })
    
    // Store channel for cleanup
    setActiveChannels(prev => {
      const newMap = new Map(prev)
      newMap.set(`conversation-${selectedConversation.id}`, conversationChannel)
      return newMap
    })

    // Clear messages when conversation changes
    setMessages([])
    
    // Cleanup function
    return () => {
      const channel = activeChannels.get(`conversation-${selectedConversation.id}`)
      if (channel) {
        channel.unbind_all()
        channel.unsubscribe()
        setActiveChannels(prev => {
          const newMap = new Map(prev)
          newMap.delete(`conversation-${selectedConversation.id}`)
          return newMap
        })
      }
    }
  }, [selectedConversation, user, pusherClient, organization?.id, activeChannels])

  // Load messages from database when query succeeds
  useEffect(() => {
    if (getMessagesQuery.data && selectedConversation) {
      const formattedMessages = getMessagesQuery.data.map((msg: any) => ({
        id: msg.id,
        text: msg.data.content || msg.data.text, // Support both 'content' and 'text' fields
        userId: msg.data.from || msg.data.userId || msg.createdBy || 'user',
        userName: msg.data.userName || msg.data.from || 'User',
        userImage: msg.data.userImage,
        timestamp: new Date(msg.data.timestamp || msg.createdAt),
        channelId: msg.data.channel || msg.data.channelId || selectedConversation.id,
        threadId: msg.data.threadId,
        mentions: msg.data.mentions,
        attachments: msg.data.attachments,
        aiCommand: msg.data.aiCommand,
        commandResult: msg.data.commandResult
      }))
      setMessages(formattedMessages.reverse()) // Reverse to show oldest first
    }
  }, [getMessagesQuery.data, selectedConversation])

  const sendMessage = useCallback(async (text: string) => {
    if (!selectedConversation || !user || !organization) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}` || user.id,
      userImage: user.imageUrl,
      timestamp: new Date(),
      channelId: selectedConversation.id,
      aiCommand: text.startsWith('@evergreen')
    }

    // Optimistically add message
    setMessages(prev => [...prev, newMessage])

    try {
      // Send via tRPC (which will handle Pusher broadcast)
      await sendMessageMutation.mutateAsync({
        content: text, // Changed from 'text' to 'content'
        conversationId: undefined, // Don't pass conversationId for channels
        channelId: selectedConversation.id // This will be used for non-UUID channel IDs
      })
      
      // Refetch messages to get the persisted message with correct ID
      await getMessagesQuery.refetch()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id))
    }

    // If it's an AI command, process it
    if (text.startsWith('@evergreen')) {
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Processing your request...',
          userId: 'evergreen-ai',
          userName: 'evergreenOS AI',
          userImage: '/evergreen-icon.svg',
          timestamp: new Date(),
          channelId: selectedConversation.id,
          commandResult: true
        }
        setMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }, [selectedConversation, user, organization, sendMessageMutation, getMessagesQuery])

  const createDMConversation = (recipientId: string, recipientName: string) => {
    const dmId = `dm-${[user?.id, recipientId].sort().join('-')}`
    
    // Check if conversation already exists
    const existing = conversations.find(c => c.id === dmId)
    if (existing) {
      setSelectedConversation(existing)
      return
    }
    
    // Create new DM conversation
    const newDM: Conversation = {
      id: dmId,
      name: recipientName,
      type: 'dm',
      unreadCount: 0,
      isOnline: onlineUsers.has(recipientId),
      participants: [user?.id || '', recipientId]
    }
    
    setConversations(prev => [...prev, newDM])
    setSelectedConversation(newDM)
  }

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}