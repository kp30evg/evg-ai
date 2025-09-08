#!/usr/bin/env node
/**
 * Improved email labeling script with better pattern matching
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

// Enhanced label definitions with better patterns
const LABEL_RULES = {
  marketing: {
    name: 'Marketing',
    patterns: [
      /unsubscribe/i,
      /promotional/i,
      /special offer/i,
      /limited time/i,
      /shop now/i,
      /free trial/i,
      /spotify premium/i
    ],
    keywords: ['sale', 'discount', 'deal', 'offer', 'promo']
  },
  news: {
    name: 'News',
    patterns: [
      /newsletter/i,
      /digest/i,
      /roundup/i,
      /substack/i,
      /medium/i,
      /daily.*update/i,
      /weekly.*recap/i,
      /research roundup/i,
      /ultimate guide/i,
      /case study/i,
      /ai pm/i,
      /agentic ai/i,
      /ai search/i,
      /gpt/i,
      /chromatic computation/i,
      /machine learning/i,
      /deep learning/i
    ],
    keywords: ['news', 'bulletin', 'update', 'article', 'report'],
    fromPatterns: [
      /substack\.com$/i,
      /medium\.com$/i,
      /theverge/i,
      /techcrunch/i,
      /product growth/i,
      /alex pawlowski/i,
      /ken huang/i,
      /aakash gupta/i,
      /superhuman/i,
      /chatgpt/i
    ]
  },
  pitch: {
    name: 'Pitch',
    patterns: [
      /partnership/i,
      /collaborate/i,
      /business proposal/i,
      /opportunity/i,
      /let's connect/i,
      /reaching out/i,
      /wanted to connect/i
    ],
    keywords: ['proposal', 'offer', 'opportunity', 'partnership']
  },
  social: {
    name: 'Social',
    patterns: [
      /facebook/i,
      /twitter/i,
      /linkedin/i,
      /instagram/i,
      /friend request/i,
      /reddit/i
    ],
    keywords: ['social', 'network', 'connect']
  },
  respond: {
    name: 'Respond',
    patterns: [
      /please reply/i,
      /please respond/i,
      /let me know/i,
      /your thoughts/i,
      /feedback/i,
      /urgent/i,
      /action required/i,
      /voice agents?/i,
      /exploring.*benefits/i,
      /summary of/i,
      /payment overdue/i,
      /notice:/i
    ],
    keywords: ['reply', 'respond', 'urgent', 'asap', 'feedback', 'thoughts'],
    subjectPatterns: [
      /\?$/,
      /re:/i,
      /voice agent/i,
      /exploring/i,
      /summary/i
    ]
  },
  meeting: {
    name: 'Meeting',
    patterns: [
      /calendar invite/i,
      /meeting request/i,
      /schedule.*call/i,
      /zoom/i,
      /google meet/i,
      /teams meeting/i,
      /appointment confirmation/i,
      /event:/i,
      /ama/i,
      /live video/i,
      /find time/i
    ],
    keywords: ['meeting', 'calendar', 'schedule', 'invite', 'appointment']
  },
  signature: {
    name: 'Signature',
    patterns: [
      /verify.*email/i,
      /confirm.*email/i,
      /welcome to/i,
      /account created/i,
      /activate.*account/i,
      /new member.*joined/i
    ],
    keywords: ['verify', 'confirm', 'activate', 'signup', 'welcome'],
    subjectPatterns: [
      /^signature$/i,
      /new member/i
    ]
  },
  login: {
    name: 'Login',
    patterns: [
      /sign.*in/i,
      /login/i,
      /security alert/i,
      /verification code/i,
      /two.?factor/i,
      /2fa/i,
      /authentication/i
    ],
    keywords: ['login', 'signin', 'auth', 'security', 'verify'],
    fromPatterns: [
      /github/i,
      /gitlab/i,
      /google/i,
      /microsoft/i,
      /apple/i,
      /development.*evergreen/i
    ]
  }
};

// Improved pattern-based classification
function classifyByPatterns(email: any): string[] {
  const labels = new Set<string>();
  
  const subject = (email.subject || '').toLowerCase();
  const fromEmail = (email.from?.email || '').toLowerCase();
  const fromName = (email.from?.name || '').toLowerCase();
  const snippet = (email.body?.snippet || '').toLowerCase().substring(0, 500);
  
  for (const [labelId, rules] of Object.entries(LABEL_RULES)) {
    let matched = false;
    
    // Check main patterns
    for (const pattern of rules.patterns) {
      if (pattern.test(subject) || pattern.test(snippet)) {
        matched = true;
        break;
      }
    }
    
    // Check keywords
    if (!matched && rules.keywords) {
      for (const keyword of rules.keywords) {
        if (subject.includes(keyword) || snippet.includes(keyword)) {
          matched = true;
          break;
        }
      }
    }
    
    // Check from patterns
    if (!matched && (rules as any).fromPatterns) {
      for (const pattern of (rules as any).fromPatterns) {
        if (pattern.test(fromEmail) || pattern.test(fromName)) {
          matched = true;
          break;
        }
      }
    }
    
    // Check subject-specific patterns
    if (!matched && (rules as any).subjectPatterns) {
      for (const pattern of (rules as any).subjectPatterns) {
        if (pattern.test(subject)) {
          matched = true;
          break;
        }
      }
    }
    
    if (matched) {
      labels.add(labelId);
    }
  }
  
  // Special case: Ken Huang emails are likely news
  if (fromEmail.includes('kenhuang') || fromName.includes('ken huang')) {
    labels.add('news');
  }
  
  // Special case: Voice agent emails need response
  if (subject.includes('voice agent')) {
    labels.add('respond');
  }
  
  // Special case: GitHub/development emails
  if (fromEmail.includes('github') || subject.includes('[development]')) {
    labels.add('login');
  }
  
  return Array.from(labels);
}

// Simplified AI classification with better prompt
async function classifyByAI(email: any): Promise<string[]> {
  try {
    const prompt = `Classify this email into categories. Return ONLY the category IDs that apply.

Categories:
- marketing: promotional emails, sales, discounts, unsubscribe links
- news: newsletters, research, articles, substack, industry updates  
- pitch: business proposals, partnership requests, cold outreach
- social: social media notifications, friend requests
- respond: emails requiring a reply, questions, urgent matters
- meeting: calendar invites, scheduling, appointments, events
- signature: account verification, welcome emails, signups
- login: login alerts, security notifications, 2FA, GitHub

Email:
From: ${email.from?.email || 'unknown'} (${email.from?.name || ''})
Subject: ${email.subject || '(no subject)'}
Preview: ${email.body?.snippet?.substring(0, 300) || ''}

Return comma-separated category IDs (e.g., "news,respond"). Return "none" if no category fits.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 30,
      temperature: 0.2
    });
    
    const result = response.choices[0]?.message?.content?.toLowerCase().trim() || 'none';
    if (result === 'none' || !result) return [];
    
    return result.split(',').map(l => l.trim()).filter(l => l in LABEL_RULES);
  } catch (error: any) {
    console.error('AI error:', error.message);
    return [];
  }
}

async function labelEmail(email: any, workspaceId: string, userId: string) {
  // Try pattern matching first
  let labels = classifyByPatterns(email);
  
  // If no patterns matched or we want more labels, use AI
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
  
  console.log(`🏷️  Email Auto-Labeling Script (Improved)`);
  console.log(`==========================================\n`);
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
    
    // Get first 50 emails from inbox
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
      .orderBy(sql`created_at DESC`)
      .limit(50);
    
    console.log(`📧 Found ${emails.length} emails to process\n`);
    
    if (emails.length === 0) {
      console.log('No emails to label');
      process.exit(0);
    }
    
    console.log('Processing emails:\n');
    
    const labelStats: Record<string, number> = {};
    let successCount = 0;
    let aiCount = 0;
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const emailData = email.data as any;
      
      // Create email object for classification
      const emailObj = {
        id: email.id,
        subject: emailData.subject,
        from: emailData.from,
        body: emailData.body || { snippet: emailData.snippet }
      };
      
      process.stdout.write(`  ${i + 1}/${emails.length}: "${emailData.subject?.substring(0, 40) || '(no subject)'}..." `);
      
      const labels = await labelEmail(emailObj, dbUser.workspaceId, dbUser.id);
      
      if (labels.length > 0) {
        console.log(`✅ [${labels.map(l => LABEL_RULES[l as keyof typeof LABEL_RULES].name).join(', ')}]`);
        successCount++;
        for (const label of labels) {
          labelStats[label] = (labelStats[label] || 0) + 1;
        }
      } else {
        console.log(`⚪ [no labels]`);
      }
      
      // Small delay between emails to avoid rate limiting
      if (i % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 LABELING COMPLETE');
    console.log('='.repeat(50));
    console.log(`\n✅ Labeled: ${successCount}/${emails.length} emails`);
    
    if (Object.keys(labelStats).length > 0) {
      console.log('\nLabel Distribution:');
      for (const [label, count] of Object.entries(labelStats)) {
        const labelDef = LABEL_RULES[label as keyof typeof LABEL_RULES];
        console.log(`  📌 ${labelDef.name}: ${count} emails`);
      }
    }
    
    console.log('\n✨ Done! Refresh your inbox to see the labels.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();