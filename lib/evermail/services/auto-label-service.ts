/**
 * Auto-Label Service for EverMail
 * Intelligent email categorization using pattern matching and AI
 */

import OpenAI from 'openai';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { LABEL_PATTERNS, AUTO_LABELS, PatternRule } from '../constants/labels';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL
});

export interface EmailData {
  id: string;
  from: { name?: string; email: string };
  to: string | string[];
  subject: string;
  body: { text?: string; html?: string; snippet?: string };
  hasAttachments?: boolean;
  threadId?: string;
  sentAt: Date;
}

export interface LabelResult {
  labels: string[];
  confidence: Record<string, number>;
  method: 'pattern' | 'ai' | 'hybrid';
  version: string;
}

export class AutoLabelService {
  private static instance: AutoLabelService;
  private version = '1.0.0';

  private constructor() {}

  static getInstance(): AutoLabelService {
    if (!AutoLabelService.instance) {
      AutoLabelService.instance = new AutoLabelService();
    }
    return AutoLabelService.instance;
  }

  /**
   * Label a single email
   */
  async labelEmail(
    email: EmailData,
    workspaceId: string,
    userId: string
  ): Promise<LabelResult> {
    // First try pattern-based classification (fast path)
    const patternResult = await this.classifyByPatterns(email);
    
    // If confident enough, return pattern results
    if (this.hasHighConfidence(patternResult)) {
      await this.saveLabels(email.id, patternResult, workspaceId, userId);
      return { ...patternResult, method: 'pattern' };
    }

    // Otherwise, use AI classification (slow path)
    const aiResult = await this.classifyByAI(email);
    
    // Merge results for hybrid approach
    const hybridResult = this.mergeResults(patternResult, aiResult);
    
    await this.saveLabels(email.id, hybridResult, workspaceId, userId);
    return { ...hybridResult, method: 'hybrid' };
  }

  /**
   * Label multiple emails in batch
   */
  async labelBatch(
    emails: EmailData[],
    workspaceId: string,
    userId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, LabelResult>> {
    const results = new Map<string, LabelResult>();
    const total = emails.length;
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, Math.min(i + batchSize, emails.length));
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(email => this.labelEmail(email, workspaceId, userId))
      );
      
      // Store results
      batch.forEach((email, idx) => {
        results.set(email.id, batchResults[idx]);
      });
      
      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, total), total);
      }
    }
    
    return results;
  }

  /**
   * Pattern-based classification (fast path)
   */
  private async classifyByPatterns(email: EmailData): Promise<LabelResult> {
    const labels: string[] = [];
    const confidence: Record<string, number> = {};
    
    // Check each label's patterns
    for (const [labelId, config] of Object.entries(LABEL_PATTERNS)) {
      let totalScore = 0;
      let matchedRules = 0;
      
      // Check pattern rules
      for (const rule of config.rules) {
        if (this.checkPatternRule(email, rule)) {
          totalScore += rule.weight;
          matchedRules++;
        }
      }
      
      // Check special functions
      if (config.specialChecks) {
        for (const check of config.specialChecks) {
          if (this.runSpecialCheck(email, check)) {
            totalScore += 0.3; // Bonus for special checks
            matchedRules++;
          }
        }
      }
      
      // Calculate confidence
      if (matchedRules > 0) {
        const avgScore = totalScore / config.rules.length;
        if (avgScore >= config.minConfidence) {
          labels.push(labelId);
          confidence[labelId] = Math.min(avgScore, 1.0);
        }
      }
    }
    
    return {
      labels,
      confidence,
      method: 'pattern',
      version: this.version
    };
  }

  /**
   * AI-based classification using GPT-4
   */
  private async classifyByAI(email: EmailData): Promise<LabelResult> {
    try {
      // Prepare email context
      const emailContext = this.prepareEmailContext(email);
      
      // Create classification prompt
      const prompt = `Analyze this email and categorize it into one or more of these labels:
- marketing: Marketing and promotional messages
- news: News and newsletter messages  
- pitch: Cold pitch and outreach messages
- social: Social network notifications
- respond: Messages that need a response
- meeting: Messages about scheduling meetings
- signature: Documents needing signature
- login: Password resets and verification codes

Email Details:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Preview: ${emailContext.preview}

Return a JSON object with:
- labels: array of applicable label IDs
- confidence: object mapping each label to confidence score (0-1)

Only include labels with confidence > 0.6.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an email classification expert. Analyze emails and categorize them accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        labels: result.labels || [],
        confidence: result.confidence || {},
        method: 'ai',
        version: this.version
      };
    } catch (error) {
      console.error('AI classification failed:', error);
      // Return empty result on error
      return {
        labels: [],
        confidence: {},
        method: 'ai',
        version: this.version
      };
    }
  }

  /**
   * Check if a pattern rule matches the email
   */
  private checkPatternRule(email: EmailData, rule: PatternRule): boolean {
    let fieldValue = '';
    
    switch (rule.field) {
      case 'from':
        fieldValue = `${email.from.name || ''} ${email.from.email}`.toLowerCase();
        break;
      case 'subject':
        fieldValue = (email.subject || '').toLowerCase();
        break;
      case 'body':
        fieldValue = (email.body.snippet || email.body.text || '').toLowerCase();
        break;
      case 'to':
        fieldValue = Array.isArray(email.to) ? email.to.join(' ').toLowerCase() : email.to.toLowerCase();
        break;
    }
    
    // Check patterns based on match type
    const matchType = rule.matchType || 'contains';
    
    for (const pattern of rule.patterns) {
      const patternLower = pattern.toLowerCase();
      
      switch (matchType) {
        case 'contains':
          if (fieldValue.includes(patternLower)) return true;
          break;
        case 'exact':
          if (fieldValue === patternLower) return true;
          break;
        case 'regex':
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(fieldValue)) return true;
          } catch (e) {
            console.error('Invalid regex pattern:', pattern);
          }
          break;
      }
    }
    
    return false;
  }

  /**
   * Run special checks for certain labels
   */
  private runSpecialCheck(email: EmailData, check: string): boolean {
    switch (check) {
      case 'hasUnsubscribeLink':
        const body = email.body.html || email.body.text || '';
        return body.toLowerCase().includes('unsubscribe') || 
               body.toLowerCase().includes('opt-out');
      
      case 'isFirstTimeContact':
        // TODO: Check if this is the first email from this sender
        return false;
      
      case 'hasCalendarLink':
        const bodyText = email.body.text || email.body.html || '';
        return bodyText.includes('calendly.com') || 
               bodyText.includes('calendar.google.com') ||
               bodyText.includes('outlook.office365.com/owa/calendar');
      
      case 'hasQuestions':
        const text = email.body.text || email.body.snippet || '';
        return (text.match(/\?/g) || []).length >= 2;
      
      case 'hasCalendarInvite':
        // Check for .ics attachment or calendar headers
        return email.hasAttachments === true; // Simplified for now
      
      case 'hasSchedulingLink':
        const content = email.body.text || email.body.html || '';
        return content.includes('schedule a') || 
               content.includes('book a time') ||
               content.includes('pick a time');
      
      case 'hasVerificationCode':
        const emailText = email.body.text || email.body.snippet || '';
        // Look for 4-8 digit codes
        return /\b\d{4,8}\b/.test(emailText);
      
      case 'isSystemGenerated':
        const fromEmail = email.from.email.toLowerCase();
        return fromEmail.includes('no-reply') || 
               fromEmail.includes('noreply') ||
               fromEmail.includes('do-not-reply');
      
      default:
        return false;
    }
  }

  /**
   * Prepare email context for AI classification
   */
  private prepareEmailContext(email: EmailData) {
    const preview = email.body.snippet || 
                   email.body.text?.substring(0, 200) || 
                   'No preview available';
    
    return {
      from: `${email.from.name || 'Unknown'} <${email.from.email}>`,
      subject: email.subject || '(No subject)',
      preview: preview.substring(0, 200)
    };
  }

  /**
   * Check if results have high confidence
   */
  private hasHighConfidence(result: LabelResult): boolean {
    if (result.labels.length === 0) return false;
    
    // Check if all labels have confidence > 0.8
    for (const label of result.labels) {
      if (result.confidence[label] < 0.8) return false;
    }
    
    return true;
  }

  /**
   * Merge pattern and AI results
   */
  private mergeResults(pattern: LabelResult, ai: LabelResult): LabelResult {
    const allLabels = new Set([...pattern.labels, ...ai.labels]);
    const confidence: Record<string, number> = {};
    
    // Average confidence scores where both methods agree
    for (const label of allLabels) {
      const scores = [];
      if (pattern.confidence[label]) scores.push(pattern.confidence[label]);
      if (ai.confidence[label]) scores.push(ai.confidence[label]);
      
      if (scores.length > 0) {
        // Weighted average: AI gets slightly more weight
        const weight = ai.confidence[label] ? 0.6 : 0.4;
        confidence[label] = scores.reduce((a, b) => a + b) / scores.length * (1 + weight * 0.1);
        confidence[label] = Math.min(confidence[label], 1.0);
      }
    }
    
    // Filter labels by confidence threshold
    const finalLabels = Array.from(allLabels).filter(
      label => confidence[label] >= 0.65
    );
    
    return {
      labels: finalLabels,
      confidence,
      method: 'hybrid',
      version: this.version
    };
  }

  /**
   * Save labels to database
   */
  private async saveLabels(
    emailId: string,
    result: LabelResult,
    workspaceId: string,
    userId: string
  ): Promise<void> {
    try {
      // Update email entity with labels
      await db
        .update(entities)
        .set({
          metadata: sql`
            COALESCE(metadata, '{}'::jsonb) || 
            jsonb_build_object(
              'autoLabels', ${JSON.stringify(result.labels)}::jsonb,
              'labelConfidence', ${JSON.stringify(result.confidence)}::jsonb,
              'labelledAt', ${new Date().toISOString()},
              'labelVersion', ${result.version}
            )
          `,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(entities.id, emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, userId),
            eq(entities.type, 'email')
          )
        );
    } catch (error) {
      console.error('Failed to save labels:', error);
      throw error;
    }
  }

  /**
   * Get label statistics for a user
   */
  async getLabelStats(
    workspaceId: string,
    userId: string
  ): Promise<Record<string, number>> {
    try {
      const result = await db
        .select({
          labels: sql<string[]>`metadata->'autoLabels'`,
          count: sql<number>`count(*)`
        })
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, userId),
            eq(entities.type, 'email'),
            sql`metadata->>'autoLabels' IS NOT NULL`
          )
        )
        .groupBy(sql`metadata->'autoLabels'`);
      
      // Count occurrences of each label
      const stats: Record<string, number> = {};
      for (const row of result) {
        if (row.labels && Array.isArray(row.labels)) {
          for (const label of row.labels) {
            stats[label] = (stats[label] || 0) + Number(row.count);
          }
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Failed to get label stats:', error);
      return {};
    }
  }
}

// Export singleton instance
export const autoLabelService = AutoLabelService.getInstance();