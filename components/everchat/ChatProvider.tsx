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
  const createConversationMutation = trpc.everchat.createConversation.useMutation()
  const getMessagesQuery = trpc.everchat.getMessages.useQuery(
    { 
      conversationId: selectedConversation?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedConversation.id) ? selectedConversation.id : undefined,
      channelId: selectedConversation?.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedConversation.id) ? selectedConversation.id : undefined,
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

    // Subscribe to organization general channel using Clerk org ID
    const generalChannel = client.subscribe(channels.orgGeneral(organization.id))
    
    // Subscribe to organization-wide presence channel for online status using Clerk org ID
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
          
          // Don't pre-create DM conversations - they'll be created on demand
          // when the user clicks on a team member
        }
      } catch (error) {
        console.error('Failed to fetch organization members:', error)
      }
    }
    
    fetchMembers()
  }, [organization?.id, user?.id])

  // Load initial conversations and messages
  useEffect(() => {
    const loadConversations = async () => {
      if (!organization?.id || !user?.id) return

      // Load initial channels
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

      // Load existing conversations from database
      try {
        // Use TRPC to get conversations
        const response = await fetch('/api/trpc/everchat.getConversations?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A100%7D%7D%7D')
        if (response.ok) {
          const data = await response.json()
          const dbConversations = data?.[0]?.result?.data?.json || []
          
          // Process database conversations that are DMs where current user is a participant
          const dmConversations = dbConversations
            .filter((conv: any) => {
              // Only show DMs where current user is a participant
              return conv.data?.title?.startsWith('DM:') && 
                     conv.data?.participants?.includes(user.id);
            })
            .map((conv: any) => {
              const participants = conv.data.participants || []
              const recipientId = participants.find((id: string) => id !== user.id)
              
              // Find the recipient's name from organization members
              const recipient = organizationMembers.find(m => m.userId === recipientId)
              const recipientName = recipient 
                ? `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email
                : 'Unknown User'
              
              return {
                id: conv.id,
                name: recipientName,
                type: 'dm' as const,
                unreadCount: 0,
                participants: participants,
                isOnline: onlineUsers.has(recipientId || '')
              }
            })
          
          // Remove duplicates based on conversation ID
          const uniqueDMs = dmConversations.reduce((acc: any[], dm: any) => {
            if (!acc.find((existing: any) => existing.id === dm.id)) {
              acc.push(dm)
            }
            return acc
          }, [])
          
          setConversations([...channelConversations, ...uniqueDMs])
        } else {
          setConversations(channelConversations)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
        setConversations(channelConversations)
      }
    }

    loadConversations()
  }, [organization?.id, user?.id, organizationMembers, onlineUsers])

  // Subscribe to selected conversation channel
  useEffect(() => {
    if (!selectedConversation || !pusherClient || !organization?.id || !user?.id) return

    // Subscribe to the specific channel using Clerk org ID
    // For conversations, use the conversation ID directly
    const channelName = selectedConversation.type === 'channel' 
      ? channels.channel(organization.id, selectedConversation.id)
      : `private-org-${organization.id}-conversation-${selectedConversation.id}`
    
    console.log('Subscribing to channel:', channelName);
    const conversationChannel = pusherClient.subscribe(channelName)
    
    // Handle subscription success
    conversationChannel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to channel:', channelName);
    });
    
    // Handle subscription error
    conversationChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('Failed to subscribe to channel:', channelName, error);
    });
    
    // Handle messages in this channel
    conversationChannel.bind(events.MESSAGE_NEW, (data: any) => {
      console.log('Received message via Pusher:', data);
      // Format the message to match our Message interface
      const formattedMessage: Message = {
        id: data.id || Date.now().toString(),
        text: data.text || data.content,
        userId: data.userId,
        userName: data.userName,
        userImage: data.userImage,
        timestamp: new Date(data.timestamp || Date.now()),
        channelId: selectedConversation.id,
      };
      setMessages(prev => {
        // Check if message already exists (to avoid duplicates)
        if (prev.some(m => m.id === formattedMessage.id)) {
          return prev;
        }
        return [...prev, formattedMessage];
      });
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
  }, [selectedConversation, user, pusherClient, organization?.id])

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

    console.log('Sending message to conversation:', selectedConversation.id, 'Type:', selectedConversation.type)

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
      // Check if this is a UUID (database conversation) or a local/channel ID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedConversation.id)
      
      if (isUUID) {
        // It's a database conversation (DM or created channel)
        console.log('Sending to database conversation:', selectedConversation.id)
        await sendMessageMutation.mutateAsync({
          content: text,
          conversationId: selectedConversation.id,
          channelId: undefined
        })
      } else if (selectedConversation.id.startsWith('dm-')) {
        // It's a local DM that hasn't been created in the database yet
        // This shouldn't happen anymore, but handle it just in case
        console.log('Local DM detected, skipping send')
        throw new Error('Please click on the user again to create the conversation')
      } else {
        // It's a named channel like 'general', 'sales', etc.
        console.log('Sending to channel:', selectedConversation.id)
        await sendMessageMutation.mutateAsync({
          content: text,
          conversationId: undefined,
          channelId: selectedConversation.id
        })
      }
      
      // Refetch messages to get the persisted message with correct ID
      await getMessagesQuery.refetch()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== newMessage.id))
      
      // Show user-friendly error
      if (error instanceof Error && error.message.includes('click on the user again')) {
        alert('Please click on the user again to start the conversation')
      }
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

  const createDMConversation = useCallback(async (recipientId: string, recipientName: string) => {
    if (!user?.id) return
    
    console.log('Creating DM conversation with:', recipientName, recipientId)
    
    // Check if conversation already exists in local state
    const existing = conversations.find(c => 
      c.type === 'dm' && 
      c.participants && 
      c.participants.includes(recipientId) && 
      c.participants.includes(user.id)
    )
    
    if (existing) {
      console.log('Found existing DM conversation:', existing.id)
      setSelectedConversation(existing)
      return
    }
    
    try {
      // Create the DM conversation in the database
      const dbConversation = await createConversationMutation.mutateAsync({
        title: `DM: ${recipientName}`,
        participants: [user.id, recipientId]
      })
      
      console.log('Created new DM conversation in database:', dbConversation.id)
      
      // Create new DM conversation object
      const newDM: Conversation = {
        id: dbConversation.id,
        name: recipientName,
        type: 'dm',
        unreadCount: 0,
        isOnline: onlineUsers.has(recipientId),
        participants: [user.id, recipientId]
      }
      
      // Add to conversations list and select it
      setConversations(prev => {
        // Remove any duplicate DMs with same participants
        const filtered = prev.filter(c => 
          !(c.type === 'dm' && c.participants?.includes(recipientId))
        )
        return [...filtered, newDM]
      })
      setSelectedConversation(newDM)
      
      // Clear messages for new conversation
      setMessages([])
    } catch (error) {
      console.error('Failed to create DM conversation:', error)
      // Fallback to local-only conversation with a unique ID
      const dmId = `dm-${Date.now()}-${[user.id, recipientId].sort().join('-')}`
      const newDM: Conversation = {
        id: dmId,
        name: recipientName,
        type: 'dm',
        unreadCount: 0,
        isOnline: onlineUsers.has(recipientId),
        participants: [user.id, recipientId]
      }
      
      setConversations(prev => {
        const filtered = prev.filter(c => 
          !(c.type === 'dm' && c.participants?.includes(recipientId))
        )
        return [...filtered, newDM]
      })
      setSelectedConversation(newDM)
      setMessages([])
    }
  }, [user?.id, conversations, onlineUsers, createConversationMutation])

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