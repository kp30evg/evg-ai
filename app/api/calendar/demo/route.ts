import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/services/google-calendar-service';

export async function POST(request: NextRequest) {
  try {
    // Demo mode - test Google Calendar service without authentication
    console.log('Testing Google Calendar service in demo mode...');
    
    // Test the service initialization
    const service = googleCalendarService;
    
    // Test credential checking
    try {
      // Access the private method through reflection for testing
      (service as any).ensureCredentials();
      console.log('✅ Google Calendar credentials validated successfully');
      
      // Simulate what would happen in a real sync
      const demoResult = {
        success: true,
        message: 'Google Calendar service is working correctly',
        simulation: {
          accountsFound: 1,
          eventsToSync: 5,
          estimatedSyncTime: '2-3 seconds',
          nextSteps: [
            'Connect a Google Calendar account via OAuth',
            'Authenticate with valid user session',
            'Sync will automatically import events'
          ]
        },
        credentials: {
          configured: true,
          clientIdPrefix: (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)?.substring(0, 12) + '...',
          hasSecret: !!process.env.GOOGLE_CLIENT_SECRET
        }
      };

      return NextResponse.json(demoResult);
      
    } catch (credError) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar credentials not properly configured',
        details: credError.message,
        fix: 'Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Demo sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Demo sync failed',
      details: error.message
    }, { status: 500 });
  }
}