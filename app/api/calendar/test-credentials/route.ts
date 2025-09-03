import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/google-calendar-service';

export async function GET(request: NextRequest) {
  try {
    // Test if Google Calendar service can initialize properly
    const service = new (googleCalendarService.constructor as any)();
    
    // Try to access the private ensureCredentials method
    try {
      (service as any).ensureCredentials();
      
      return NextResponse.json({ 
        success: true,
        message: 'Google Calendar credentials are properly configured',
        credentials: {
          hasClientId: !!(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          clientId: (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)?.substring(0, 10) + '...',
        }
      });
      
    } catch (credentialsError) {
      return NextResponse.json({ 
        success: false,
        error: 'Credentials validation failed',
        details: credentialsError.message,
        env: {
          hasClientId: !!(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error testing Google Calendar credentials:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test credentials',
      details: error.message
    }, { status: 500 });
  }
}