import { auth } from '@clerk/nextjs/server'
import { pusher } from '@/lib/pusher'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check if Pusher is configured
    if (!pusher) {
      console.log('Pusher not configured');
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 })
    }
    
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      console.log('Pusher auth failed - no user or org:', { userId, orgId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const socketId = formData.get('socket_id') as string
    const channelName = formData.get('channel_name') as string

    console.log('Pusher auth request:', { userId, orgId, channelName, socketId: socketId?.substring(0, 10) + '...' });

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Extract org ID from channel name to verify access
    // Formats: 
    // - private-org-{orgId}-general
    // - private-org-{orgId}-channel-{channelId}
    // - private-org-{orgId}-user-{userId1}-{userId2}
    // - presence-org-{orgId}
    // - presence-org-{orgId}-channel-{channelId}
    
    const channelParts = channelName.split('-')
    const channelPrefix = channelParts[0]
    
    // Verify it's a valid channel type
    if (channelPrefix !== 'private' && channelPrefix !== 'presence') {
      return NextResponse.json({ error: 'Invalid channel type' }, { status: 400 })
    }
    
    // Verify it's an org channel
    if (channelParts[1] !== 'org') {
      return NextResponse.json({ error: 'Invalid channel format' }, { status: 400 })
    }

    const channelOrgId = channelParts[2]
    
    // Verify user can only subscribe to their org's channels
    if (channelOrgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden - cannot access other organization channels' }, { status: 403 })
    }
    
    // Additional validation for DM channels
    if (channelParts[3] === 'user') {
      // Ensure user is one of the participants in the DM
      const participants = channelParts.slice(4)
      if (!participants.includes(userId)) {
        return NextResponse.json({ error: 'Forbidden - not a participant in this DM' }, { status: 403 })
      }
    }

    // Generate auth response for Pusher
    let authResponse;
    
    if (channelPrefix === 'presence') {
      // For presence channels, include user data
      authResponse = pusher.authorizeChannel(socketId, channelName, {
        user_id: userId,
        user_info: {
          organizationId: orgId,
          // You can add more user info here if needed
        }
      });
    } else {
      // For private channels, just authorize
      authResponse = pusher.authorizeChannel(socketId, channelName);
    }

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}