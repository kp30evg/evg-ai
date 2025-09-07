#!/usr/bin/env tsx

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

async function test() {
  console.log('Testing AI response format...\n');
  
  const SYSTEM_PROMPT = `You are evergreenOS, an AI business assistant. 

When users give commands, analyze their intent and respond with a JSON object:
{
  "action": "email" | "calendar" | "crm" | "chat" | "search" | "answer",
  "parameters": { ... },
  "response": "Markdown formatted response to show the user",
  "suggestions": ["Follow-up action 1", "Follow-up action 2", "Follow-up action 3"]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const testCommands = [
    'Send an email to john@example.com about the quarterly meeting',
    'What are the benefits of cloud computing?',
    'Show me all my contacts'
  ];

  for (const command of testCommands) {
    console.log(`\nCommand: "${command}"`);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: command }
        ],
        temperature: 0.3
      });
      
      const response = completion.choices[0].message.content;
      console.log('Raw response:', response?.substring(0, 200));
      
      try {
        const parsed = JSON.parse(response || '{}');
        console.log('✅ Valid JSON - Action:', parsed.action);
      } catch (e) {
        console.log('❌ Invalid JSON');
      }
    } catch (error) {
      console.log('❌ API Error:', error.message);
    }
  }
}

test();