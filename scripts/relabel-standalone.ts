#!/usr/bin/env node
/**
 * Standalone re-labeling script with improved logic
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
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Import schema after env is loaded
import { entities, users, workspaces } from '../lib/db/schema/unified';

// Improved classification logic
class EmailClassifier {
  private userEmail: string = '';

  setUserEmail(email: string) {
    this.userEmail = email.toLowerCase();
  }

  isSelfEmail(from: string, to: any): boolean {
    if (!this.userEmail) return false;
    
    const fromEmail = from?.toLowerCase();
    
    // Check if it's from the user
    if (fromEmail === this.userEmail) {
      // Handle various to field formats
      let toEmails: string[] = [];
      
      if (Array.isArray(to)) {
        toEmails = to.map(t => (typeof t === 'string' ? t : t.email || '').toLowerCase());
      } else if (typeof to === 'string') {
        toEmails = [to.toLowerCase()];
      } else if (to && to.email) {
        toEmails = [to.email.toLowerCase()];
      }
      
      // Check if it's only to themselves
      if (toEmails.length === 1 && toEmails[0] === this.userEmail) {
        return true;
      }
    }
    
    return false;
  }

  isTestEmail(subject: string, body: string): boolean {
    const s = subject?.toLowerCase() || '';
    const testSubjects = ['test', 'hi', 'hello', 'hey', '(no subject)'];
    
    if (testSubjects.includes(s.trim())) {
      return true;
    }
    
    if (body.length < 50 && !subject) {
      return true;
    }
    
    return false;
  }

  async classifyEmail(email: any): Promise<string[]> {
    const from = email.from?.email || '';
    const fromName = email.from?.name || '';
    const to = email.to || [];
    const subject = email.subject || '';
    const body = email.body?.text || email.body?.snippet || '';
    
    // Check exclusions first
    if (this.isSelfEmail(from, to)) {
      return [];
    }
    
    if (this.isTestEmail(subject, body)) {
      return [];
    }
    
    const labels: string[] = [];
    
    // Very strict pattern matching
    
    // Marketing - needs multiple indicators
    const hasUnsubscribe = body.toLowerCase().includes('unsubscribe');
    const hasPromo = /sale|discount|% off|limited time|special offer/i.test(subject + ' ' + body);
    const marketingFrom = /newsletter@|noreply@|marketing@|promo@/.test(from);
    if ((hasUnsubscribe && hasPromo) || (hasUnsubscribe && marketingFrom)) {
      labels.push('marketing');
    }
    
    // News - actual newsletters
    const newsletterDomains = ['substack.com', 'mailchimp.com', 'beehiiv.com'];
    const isNewsletter = newsletterDomains.some(d => from.includes(d));
    const hasNewsKeywords = /newsletter|digest|roundup|bulletin|weekly.*update/i.test(subject);
    const knownNewsAuthors = /ken huang|agentic ai|ai pm|magicpath/i.test(fromName + ' ' + subject);
    if (isNewsletter || hasNewsKeywords || knownNewsAuthors) {
      if (!labels.includes('marketing')) {
        labels.push('news');
      }
    }
    
    // Login - must have security keywords
    const hasSecurityKeywords = /verification code|security code|2fa|authentication/i.test(subject);
    const hasCode = /\b\d{6}\b/.test(body);
    const isGitHub = from.includes('github.com') && subject.includes('verification');
    if ((hasSecurityKeywords && hasCode) || isGitHub) {
      labels.push('login');
    }
    
    // Respond - only if clear question to user
    const hasQuestion = /\?|can you|could you|would you|please.*\?|let me know|please respond/i.test(body);
    const notAutomated = !from.includes('noreply') && !hasUnsubscribe;
    const toCount = Array.isArray(to) ? to.length : 1;
    const isDirectMessage = toCount === 1;
    const notSelfEmail = from !== this.userEmail;
    
    // Special case: "Summary of" or "Exploring" emails are informational
    const isInformational = /^(summary of|exploring|overview of)/i.test(subject);
    
    if (hasQuestion && notAutomated && isDirectMessage && notSelfEmail && !isInformational) {
      labels.push('respond');
    }
    
    // Meeting - scheduling language
    const hasMeetingKeywords = /schedule|calendar|meeting|appointment|zoom\.us|teams\.microsoft/i.test(subject + ' ' + body);
    const hasTimeDiscussion = /available|availability|time slot|confirm.*time/i.test(body);
    if (hasMeetingKeywords && hasTimeDiscussion) {
      labels.push('meeting');
    }
    
    // Signature - document signing
    const signatureDomains = ['docusign.net', 'hellosign.com', 'pandadoc.com'];
    const isSignature = signatureDomains.some(d => from.includes(d));
    const hasSignKeywords = /signature requested|please sign|document.*sign/i.test(subject + ' ' + body);
    if (isSignature || hasSignKeywords) {
      labels.push('signature');
    }
    
    // Social - strict domain match
    const socialDomains = ['linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com', 'reddit.com'];
    if (socialDomains.some(d => from.includes(d))) {
      labels.push('social');
    }
    
    // Pitch - cold outreach
    const hasIntro = /my name is|i'm reaching out|hope this finds you well/i.test(body);
    const hasPitch = /opportunity|partnership|proposal|offer.*services/i.test(body);
    const isLongEmail = body.length > 1000;
    if (hasIntro && hasPitch && isLongEmail) {
      labels.push('pitch');
    }
    
    // Limit to max 2 labels
    return labels.slice(0, 2);
  }
}

async function clearAndRelabel() {
  const clerkUserId = process.argv[2] || 'user_321PIsZrSDgVtG1YS8G8P9kwfVn';
  
  console.log(`🏷️  Smart Email Re-Labeling`);
  console.log(`============================\n`);
  
  try {
    // Get user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found');
      process.exit(1);
    }
    
    console.log(`✅ User: ${dbUser.email}`);
    console.log(`📁 Workspace: ${dbUser.workspaceId}\n`);
    
    // Clear existing labels
    console.log('🧹 Clearing old labels...');
    await db
      .update(entities)
      .set({
        metadata: sql`
          COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object('autoLabels', '[]'::jsonb)
        `
      })
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      );
    
    // Get emails
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
    
    console.log(`📧 Re-labeling ${emails.length} emails...\n`);
    
    const classifier = new EmailClassifier();
    classifier.setUserEmail(dbUser.email || '');
    
    const stats = {
      labeled: 0,
      selfEmails: 0,
      testEmails: 0,
      noLabels: 0,
      byLabel: {} as Record<string, number>
    };
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const data = email.data as any;
      
      const shortSubject = (data.subject || '(no subject)').substring(0, 40);
      process.stdout.write(`${i + 1}. "${shortSubject}"... `);
      
      // Check if self-email
      if (classifier.isSelfEmail(data.from?.email || '', data.to || [])) {
        console.log('🚫 [self-email]');
        stats.selfEmails++;
        continue;
      }
      
      // Check if test email
      if (classifier.isTestEmail(data.subject, data.body?.snippet || '')) {
        console.log('⚪ [test email]');
        stats.testEmails++;
        continue;
      }
      
      // Classify
      const labels = await classifier.classifyEmail(data);
      
      if (labels.length > 0) {
        // Save labels
        await db
          .update(entities)
          .set({
            metadata: sql`
              COALESCE(metadata, '{}'::jsonb) || 
              jsonb_build_object('autoLabels', ${JSON.stringify(labels)}::jsonb)
            `
          })
          .where(eq(entities.id, email.id));
        
        console.log(`✅ [${labels.join(', ')}]`);
        stats.labeled++;
        
        for (const label of labels) {
          stats.byLabel[label] = (stats.byLabel[label] || 0) + 1;
        }
      } else {
        console.log('⚪ [no labels]');
        stats.noLabels++;
      }
      
      // Small delay
      if (i % 10 === 9) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    // Show results
    console.log('\n' + '='.repeat(40));
    console.log('📊 RESULTS');
    console.log('='.repeat(40));
    console.log(`✅ Labeled: ${stats.labeled}`);
    console.log(`🚫 Self-emails: ${stats.selfEmails}`);
    console.log(`⚪ Test emails: ${stats.testEmails}`);
    console.log(`⚪ No labels: ${stats.noLabels}`);
    
    if (Object.keys(stats.byLabel).length > 0) {
      console.log('\nLabel counts:');
      for (const [label, count] of Object.entries(stats.byLabel)) {
        console.log(`  ${label}: ${count}`);
      }
    }
    
    console.log('\n✨ Done! Refresh inbox to see improved labels.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAndRelabel();