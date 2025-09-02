import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
const createPusherInstance = () => {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const secret = process.env.PUSHER_SECRET;
  
  // Check if Pusher is properly configured
  if (!appId || !key || !secret || 
      appId === 'YOUR_PUSHER_APP_ID' || 
      key === 'YOUR_PUSHER_APP_KEY' || 
      secret === 'YOUR_PUSHER_SECRET') {
    console.warn('Pusher not configured on server. Real-time features disabled.');
    return null;
  }
  
  return new Pusher({
    appId,
    key,
    secret,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true
  });
};

export const pusher = createPusherInstance();

// Client-side Pusher configuration
export const getPusherClient = (userId: string, organizationId: string) => {
  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  
  if (!appKey || appKey === 'YOUR_PUSHER_APP_KEY') {
    console.warn('Pusher app key not configured. Real-time features will be disabled.');
    return null;
  }
  
  return new PusherClient(appKey, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    authEndpoint: '/api/pusher/auth',
    auth: {
      params: {
        userId,
        organizationId
      }
    }
  });
};

// Channel naming utilities
export const channels = {
  // General organization channel
  orgGeneral: (orgId: string) => `private-org-${orgId}-general`,
  
  // Specific channel
  channel: (orgId: string, channelId: string) => `private-org-${orgId}-channel-${channelId}`,
  
  // Direct message channel (user-to-user)
  dm: (orgId: string, userId1: string, userId2: string) => {
    // Sort user IDs to ensure consistent channel naming
    const sortedIds = [userId1, userId2].sort();
    return `private-org-${orgId}-user-${sortedIds.join('-')}`;
  },
  
  // Presence channel for online status
  presence: (orgId: string, channelId: string) => `presence-org-${orgId}-channel-${channelId}`,
  
  // Organization-wide presence
  orgPresence: (orgId: string) => `presence-org-${orgId}`
};

// Event names
export const events = {
  MESSAGE_NEW: 'message.new',
  MESSAGE_EDIT: 'message.edit',
  MESSAGE_DELETE: 'message.delete',
  USER_TYPING: 'user.typing',
  USER_STOPPED_TYPING: 'user.stopped_typing',
  CHANNEL_CREATED: 'channel.created',
  CHANNEL_UPDATED: 'channel.updated',
  MEMBER_ADDED: 'pusher:member_added',
  MEMBER_REMOVED: 'pusher:member_removed',
  SUBSCRIPTION_SUCCEEDED: 'pusher:subscription_succeeded'
};