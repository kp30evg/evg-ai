#!/usr/bin/env node
/**
 * Standalone email labeling script
 * Labels emails with auto-labels using pattern matching and AI
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';
import OpenAI from 'openai';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env') });

// Check for required environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Initialize database
const dbClient = neon(DATABASE_URL);
const db = drizzle(dbClient);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Import schema after env is loaded
import { entities, users, workspaces } from '../lib/db/schema/unified';

// Label definitions
const AUTO_LABELS = {
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    patterns: [
      /unsubscribe/i,
      /marketing email/i,
      /promotional/i,
      /special offer/i,
      /sale/i,
      /discount/i,
      /deal/i,
      /limited time/i,
      /shop now/i,
      /buy now/i
    ]
  },
  news: {
    id: 'news',
    name: 'News',
    patterns: [
      /newsletter/i,
      /weekly digest/i,
      /news update/i,
      /roundup/i,
      /bulletin/i,
      /announcement/i,
      /substack/i,
      /medium\.com/i,
      /research roundup/i,
      /ultimate guide/i,
      /case study/i,
      /lessons from/i
    ]
  },
  pitch: {
    id: 'pitch',
    name: 'Pitch',
    patterns: [
      /partnership/i,
      /collaborate/i,
      /business proposal/i,
      /opportunity/i,
      /let's connect/i,
      /reaching out/i,
      /wanted to connect/i,
      /quick chat/i,
      /introduce myself/i
    ]
  },
  social: {
    id: 'social',
    name: 'Social',
    patterns: [
      /facebook/i,
      /twitter/i,
      /linkedin/i,
      /instagram/i,
      /social media/i,
      /friend request/i,
      /followed you/i,
      /mentioned you/i,
      /tagged you/i
    ]
  },
  respond: {
    id: 'respond',
    name: 'Respond',
    patterns: [
      /\?$/,
      /please reply/i,
      /please respond/i,
      /let me know/i,
      /your thoughts/i,
      /feedback/i,
      /urgent/i,
      /asap/i,
      /action required/i,
      /voice agents/i,
      /exploring the benefits/i,
      /summary of/i
    ]
  },
  meeting: {
    id: 'meeting',
    name: 'Meeting',
    patterns: [
      /calendar invite/i,
      /meeting request/i,
      /schedule a call/i,
      /zoom meeting/i,
      /google meet/i,
      /teams meeting/i,
      /invitation:/i,
      /rsvp/i,
      /agenda/i
    ]
  },
  signature: {
    id: 'signature',
    name: 'Signature',
    patterns: [
      /verify your email/i,
      /confirm your email/i,
      /sign up/i,
      /welcome to/i,
      /account created/i,
      /registration/i,
      /activate your account/i,
      /reset password/i
    ]
  },
  login: {
    id: 'login',
    name: 'Login',
    patterns: [
      /sign in/i,
      /login attempt/i,
      /security alert/i,
      /verification code/i,
      /two-factor/i,
      /2fa/i,
      /github/i,
      /gitlab/i,
      /google account/i,
      /microsoft account/i
    ]
  }
};

// Pattern-based classification
function classifyByPatterns(email: any): string[] {
  const labels: string[] = [];
  const textToCheck = `${email.subject || ''} ${email.from?.email || ''} ${email.from?.name || ''} ${email.body?.snippet || ''}`;
  
  for (const [labelId, labelDef] of Object.entries(AUTO_LABELS)) {
    for (const pattern of labelDef.patterns) {
      if (pattern.test(textToCheck)) {
        labels.push(labelId);
        break;
      }
    }
  }
  
  return labels;
}

// AI-based classification
async function classifyByAI(email: any): Promise<string[]> {
  try {
    const prompt = `Classify this email into one or more of these categories: marketing, news, pitch, social, respond, meeting, signature, login.

Email:
From: ${email.from?.email || 'unknown'}
Subject: ${email.subject || '(no subject)'}
Preview: ${email.body?.snippet?.substring(0, 200) || 'No content'}

Return only the applicable category names as a comma-separated list. If none apply, return "none".`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.3
    });
    
    const result = response.choices[0]?.message?.content?.toLowerCase() || 'none';
    if (result === 'none') return [];
    
    return result.split(',').map(l => l.trim()).filter(l => l in AUTO_LABELS);
  } catch (error) {
    console.error('AI classification error:', error);
    return [];
  }
}

async function labelEmail(email: any, workspaceId: string, userId: string) {
  // Try pattern matching first
  let labels = classifyByPatterns(email);
  
  // If no patterns matched, use AI
  if (labels.length === 0) {
    labels = await classifyByAI(email);
  }
  
  // Save labels to database
  if (labels.length > 0) {
    await db
      .update(entities)
      .set({
        metadata: sql`
          COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object('autoLabels', ${JSON.stringify(labels)}::jsonb)
        `,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(entities.id, email.id),
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, userId)
        )
      );
  }
  
  return labels;
}

async function main() {
  const clerkUserId = process.argv[3] || 'user_321PIsZrSDgVtG1YS8G8P9kwfVn';
  
  console.log(`🏷️  Email Auto-Labeling Script`);
  console.log(`================================\n`);
  console.log(`User: ${clerkUserId}\n`);
  
  try {
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found in database');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${dbUser.email}`);
    console.log(`📁 Workspace: ${dbUser.workspaceId}\n`);
    
    // Get all emails
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      )
      .limit(100);
    
    console.log(`📧 Found ${emails.length} emails to process\n`);
    
    if (emails.length === 0) {
      console.log('No emails to label');
      process.exit(0);
    }
    
    console.log('Processing emails:\n');
    
    const labelStats: Record<string, number> = {};
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const emailData = email.data as any;
      
      process.stdout.write(`  ${i + 1}/${emails.length}: "${emailData.subject?.substring(0, 40)}..." `);
      
      const labels = await labelEmail(email, dbUser.workspaceId, dbUser.id);
      
      if (labels.length > 0) {
        console.log(`✅ [${labels.join(', ')}]`);
        for (const label of labels) {
          labelStats[label] = (labelStats[label] || 0) + 1;
        }
      } else {
        console.log(`⚪ [no labels]`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 LABELING COMPLETE');
    console.log('='.repeat(50));
    console.log('\nLabel Distribution:');
    
    for (const [label, count] of Object.entries(labelStats)) {
      const labelDef = AUTO_LABELS[label as keyof typeof AUTO_LABELS];
      console.log(`  ${labelDef.name}: ${count} emails`);
    }
    
    console.log('\n✨ Done! Refresh your inbox to see the labels.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();