import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Process command with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are evergreenOS, an advanced business operations AI assistant. 
          You help process business commands across multiple modules including CRM, Email, Tasks, Calendar, etc.
          Parse the user's command and return a structured response indicating what action would be taken.
          For now, return a simulated response as the modules are not yet fully implemented.`
        },
        {
          role: 'user',
          content: command
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;

    // In a real implementation, this would execute actual business logic
    return NextResponse.json({
      success: true,
      command,
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Command processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
}