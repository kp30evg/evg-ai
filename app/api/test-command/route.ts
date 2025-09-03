import { NextRequest, NextResponse } from 'next/server';
import { processCommand } from '@/lib/modules-simple/command-processor';

export async function POST(request: NextRequest) {
  try {
    const { command, workspaceId } = await request.json();

    if (!command || !workspaceId) {
      return NextResponse.json(
        { error: 'command and workspaceId are required' },
        { status: 400 }
      );
    }

    // Process command with the unified system
    const result = await processCommand(workspaceId, command, 'test-user');

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Test command processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process command' },
      { status: 500 }
    );
  }
}