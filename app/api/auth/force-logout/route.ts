import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST() {
  try {
    // Get current session
    const { userId, sessionId } = await auth();
    
    if (sessionId) {
      // Force revoke the current session
      await clerkClient.sessions.revokeSession(sessionId);
    }
    
    // Clear all auth cookies
    const response = NextResponse.json({ success: true, message: 'Force logout complete' });
    
    // Clear Clerk cookies
    response.cookies.set('__session', '', { maxAge: 0 });
    response.cookies.set('__clerk_db_jwt', '', { maxAge: 0 });
    response.cookies.set('__client_uat', '', { maxAge: 0 });
    
    return response;
  } catch (error) {
    console.error('Force logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}