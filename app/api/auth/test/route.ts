import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = auth();
    
    return NextResponse.json({
      hasAuth: !!authResult,
      userId: authResult?.userId || null,
      orgId: authResult?.orgId || null,
      sessionId: authResult?.sessionId || null,
      authStatus: authResult ? 'authenticated' : 'not authenticated',
      headers: {
        authorization: request.headers.get('authorization') || null,
        cookie: request.headers.get('cookie')?.substring(0, 100) + '...' || null
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      error: 'Auth test failed',
      message: error.message,
      authStatus: 'error'
    }, { status: 500 });
  }
}