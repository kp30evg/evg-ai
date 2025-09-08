/**
 * Improved Auto-Label Service v2
 * Much stricter classification with fewer false positives
 */

import OpenAI from 'openai';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export interface EmailData {
  id: string;
  from: { email: string; name?: string };
  to: { email: string; name?: string }[] | string[];
  subject: string;
  body: { text?: string; html?: string; snippet?: string } | string;
  hasAttachments: boolean;
  threadId?: string;
  sentAt: Date;
  headers?: Record<string, string>;
}

interface LabelResult {
  labels: string[];
  confidence: Record<string, number>;
  reasoning?: string;
  method: 'pattern' | 'ai' | 'hybrid' | 'excluded';
}

// Confidence thresholds for each label
const CONFIDENCE_THRESHOLDS: Record<string, number> = {
  marketing: 0.7,    // Lower threshold for marketing
  news: 0.7,         // Lower threshold for newsletters
  respond: 0.85,     // High confidence needed
  login: 0.9,        // Very high confidence
  signature: 0.9,    // Very high confidence
  meeting: 0.8,      // High confidence
  pitch: 0.8,        // High confidence
  social: 0.85       // High confidence
};

// Strict exclusion rules - never label these
const EXCLUSION_RULES = [
  {
    name: 'too_short',
    test: (email: EmailData) => {
      const bodyText = typeof email.body === 'string' ? email.body : (email.body?.text || email.body?.snippet || '');
      return bodyText.length < 50;
    }
  },
  {
    name: 'test_email',
    test: (email: EmailData) => {
      const subject = email.subject?.toLowerCase() || '';
      return ['test', 'hi', 'hello', 'hey'].includes(subject.trim());
    }
  },
  {
    name: 'no_content',
    test: (email: EmailData) => {
      const hasSubject = email.subject && email.subject.trim().length > 0;
      const bodyText = typeof email.body === 'string' ? email.body : (email.body?.text || email.body?.snippet || '');
      const hasBody = bodyText.trim().length > 0;
      return !hasSubject && !hasBody;
    }
  },
  {
    name: 'no_subject',
    test: (email: EmailData) => {
      return !email.subject || email.subject === '(No subject)' || email.subject === '(no subject)';
    }
  }
];

class ImprovedAutoLabelService {
  private currentUserEmail: string | null = null;

  setCurrentUser(email: string) {
    this.currentUserEmail = email;
  }

  async labelEmail(email: EmailData, workspaceId: string, userId: string, userEmail?: string): Promise<LabelResult> {
    // Set current user if provided
    if (userEmail) {
      this.currentUserEmail = userEmail;
    }

    // Check exclusion rules first
    const excludedReason = this.checkExclusions(email);
    if (excludedReason) {
      return {
        labels: [],
        confidence: {},
        reasoning: excludedReason,
        method: 'excluded'
      };
    }

    // Check if it's a self-email
    if (this.isSelfEmail(email)) {
      return {
        labels: [],
        confidence: {},
        reasoning: 'Self-sent email',
        method: 'excluded'
      };
    }

    // Try strict pattern matching first
    const patternResult = this.strictPatternMatch(email);
    
    // If we have high confidence patterns, use them
    if (this.hasHighConfidenceLabels(patternResult)) {
      await this.saveLabels(email.id, patternResult.labels, workspaceId, userId);
      return { ...patternResult, method: 'pattern' };
    }

    // Use AI for complex classification
    const aiResult = await this.classifyWithAI(email);
    
    // Combine results with confidence weighting
    const combinedResult = this.combineResults(patternResult, aiResult);
    
    // Filter by confidence thresholds
    const filteredLabels = this.filterByConfidence(combinedResult);
    
    // Save to database
    if (filteredLabels.length > 0) {
      await this.saveLabels(email.id, filteredLabels, workspaceId, userId);
    }

    return {
      labels: filteredLabels,
      confidence: combinedResult.confidence,
      reasoning: combinedResult.reasoning,
      method: 'hybrid'
    };
  }

  private checkExclusions(email: EmailData): string | null {
    for (const rule of EXCLUSION_RULES) {
      if (rule.test(email)) {
        return `Excluded: ${rule.name}`;
      }
    }
    return null;
  }

  private isSelfEmail(email: EmailData): boolean {
    if (!this.currentUserEmail) return false;
    
    const fromEmail = email.from?.email?.toLowerCase();
    const userEmail = this.currentUserEmail.toLowerCase();
    
    // Check if sender is current user
    if (fromEmail === userEmail) {
      // Check if it's also TO the same user (self-conversation)
      const toEmails = email.to.map(t => 
        typeof t === 'string' ? t.toLowerCase() : t.email?.toLowerCase()
      );
      
      // If only recipient is self, it's a self-email
      if (toEmails.length === 1 && toEmails[0] === userEmail) {
        return true;
      }
    }
    
    return false;
  }

  private strictPatternMatch(email: EmailData): LabelResult {
    const labels: string[] = [];
    const confidence: Record<string, number> = {};
    
    const fromEmail = email.from?.email?.toLowerCase() || '';
    const fromName = email.from?.name?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    const bodyText = this.getBodyText(email).toLowerCase();
    const fullText = `${subject} ${bodyText}`;

    // Marketing - strict rules
    if (this.isMarketing(fromEmail, subject, bodyText)) {
      labels.push('marketing');
      confidence.marketing = 0.9;
    }

    // News - must be actual newsletter
    if (this.isNewsletter(fromEmail, fromName, subject, bodyText)) {
      labels.push('news');
      confidence.news = 0.9;
    }

    // Login - very strict, must have verification code
    if (this.isLoginSecurity(fromEmail, subject, bodyText)) {
      labels.push('login');
      confidence.login = 0.95;
    }

    // Respond - only if clear question and not automated
    if (this.needsResponse(email, fromEmail, subject, bodyText)) {
      labels.push('respond');
      confidence.respond = 0.85;
    }

    // Meeting - must have scheduling language
    if (this.isMeetingRequest(subject, bodyText)) {
      labels.push('meeting');
      confidence.meeting = 0.85;
    }

    // Signature - document signing only
    if (this.isSignatureRequest(fromEmail, subject, bodyText)) {
      labels.push('signature');
      confidence.signature = 0.9;
    }

    // Pitch - cold outreach detection
    if (this.isPitchEmail(email, fromEmail, subject, bodyText)) {
      labels.push('pitch');
      confidence.pitch = 0.8;
    }

    // Social - strict domain matching
    if (this.isSocialNotification(fromEmail)) {
      labels.push('social');
      confidence.social = 0.95;
    }

    return { labels, confidence, method: 'pattern' };
  }

  private isMarketing(from: string, subject: string, body: string): boolean {
    const hasUnsubscribe = body.includes('unsubscribe') || body.includes('opt-out') || body.includes('opt out');
    const hasMarketingDomain = /newsletter@|noreply@|marketing@|promo@|offers@|deals@/.test(from);
    const hasPromoLanguage = /sale|discount|% off|limited time|special offer|exclusive|deal|save \$|free shipping/i.test(subject + ' ' + body);
    
    // Need at least 2 indicators
    const indicators = [hasUnsubscribe, hasMarketingDomain, hasPromoLanguage].filter(Boolean).length;
    return indicators >= 2;
  }

  private isNewsletter(from: string, fromName: string, subject: string, body: string): boolean {
    const newsletterDomains = ['substack.com', 'mailchimp.com', 'convertkit.com', 'beehiiv.com', 'ghost.io'];
    const hasNewsletterDomain = newsletterDomains.some(domain => from.includes(domain));
    
    const newsletterKeywords = /newsletter|digest|weekly update|daily brief|roundup|bulletin|news update|this week in/i;
    const hasNewsletterKeywords = newsletterKeywords.test(subject) || newsletterKeywords.test(body.substring(0, 200));
    
    const knownNewsletters = /ken huang|agentic ai|ai pm|product growth|ai case study/i;
    const isKnownNewsletter = knownNewsletters.test(fromName) || knownNewsletters.test(subject);
    
    return hasNewsletterDomain || (hasNewsletterKeywords && !this.isMarketing(from, subject, body)) || isKnownNewsletter;
  }

  private isLoginSecurity(from: string, subject: string, body: string): boolean {
    const securityDomains = /noreply|no-reply|donotreply|accounts|security/i;
    const hasSecurityDomain = securityDomains.test(from);
    
    const codePatterns = /verification code|security code|one-time password|2fa code|authentication code|confirm your identity/i;
    const hasCodeLanguage = codePatterns.test(subject) || codePatterns.test(body);
    
    // Look for actual codes (6-digit, etc)
    const hasActualCode = /\b\d{6}\b|\b[A-Z0-9]{6,8}\b/.test(body);
    
    // GitHub specific
    const isGitHub = from.includes('github.com') && (subject.includes('verification') || subject.includes('[GitHub]'));
    
    return (hasSecurityDomain && hasCodeLanguage) || (hasCodeLanguage && hasActualCode) || isGitHub;
  }

  private needsResponse(email: EmailData, from: string, subject: string, body: string): boolean {
    // Never mark self-emails as needing response
    if (this.isSelfEmail(email)) return false;
    
    // Skip automated emails
    if (/noreply|no-reply|donotreply|notification/i.test(from)) return false;
    
    // Skip if it has unsubscribe (marketing/newsletter)
    if (body.includes('unsubscribe')) return false;
    
    // Must have a question or request
    const hasQuestion = /\?|can you|could you|would you|please.*\?|what do you think|thoughts\?|let me know|please respond|please reply/i.test(body);
    
    // Voice agents example - these are informational, not requiring response
    if (subject.includes('Summary of') || subject.includes('Exploring the Benefits')) {
      return false;
    }
    
    // Check if it's a direct message (not bulk)
    const toEmails = email.to.map(t => typeof t === 'string' ? t : t.email);
    const isDirectMessage = toEmails.length === 1;
    
    return hasQuestion && isDirectMessage;
  }

  private isMeetingRequest(subject: string, body: string): boolean {
    const schedulingKeywords = /schedule|calendar|meeting|appointment|call|zoom|teams|google meet/i;
    const hasSchedulingKeywords = schedulingKeywords.test(subject) || schedulingKeywords.test(body);
    
    const timeKeywords = /available|availability|time slot|when.*free|propose.*time|confirm.*time/i;
    const hasTimeKeywords = timeKeywords.test(body);
    
    const calendarLinks = /calendar\.google|calendly|zoom\.us\/j|teams\.microsoft/i;
    const hasCalendarLink = calendarLinks.test(body);
    
    return (hasSchedulingKeywords && hasTimeKeywords) || hasCalendarLink;
  }

  private isSignatureRequest(from: string, subject: string, body: string): boolean {
    const signatureDomains = ['docusign.net', 'hellosign.com', 'pandadoc.com', 'adobe.com', 'dropbox.com'];
    const hasSignatureDomain = signatureDomains.some(domain => from.includes(domain));
    
    const signatureKeywords = /signature requested|please sign|document.*sign|awaiting.*signature|review and sign/i;
    const hasSignatureKeywords = signatureKeywords.test(subject) || signatureKeywords.test(body);
    
    return hasSignatureDomain || hasSignatureKeywords;
  }

  private isPitchEmail(email: EmailData, from: string, subject: string, body: string): boolean {
    // Skip if from known contact (would need to track this)
    // For now, check for cold outreach patterns
    
    const introPatterns = /my name is|i'm reaching out|i wanted to connect|hope this finds you well|came across your/i;
    const hasIntroduction = introPatterns.test(body);
    
    const pitchLanguage = /opportunity|partnership|proposal|collaborate|offer|services|solution|help you|grow your/i;
    const hasPitchLanguage = pitchLanguage.test(body);
    
    // Long emails are often pitches
    const isLongEmail = body.length > 1000;
    
    return hasIntroduction && hasPitchLanguage && isLongEmail;
  }

  private isSocialNotification(from: string): boolean {
    const socialDomains = [
      'linkedin.com',
      'twitter.com',
      'facebook.com',
      'facebookmail.com',
      'instagram.com',
      'github.com',
      'reddit.com',
      'pinterest.com',
      'tiktok.com'
    ];
    
    return socialDomains.some(domain => from.includes(domain));
  }

  private async classifyWithAI(email: EmailData): Promise<LabelResult> {
    try {
      const prompt = this.buildAIPrompt(email);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 100,
        temperature: 0.2
      });
      
      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        labels: result.labels || [],
        confidence: result.confidence || {},
        reasoning: result.reasoning,
        method: 'ai'
      };
    } catch (error) {
      console.error('AI classification error:', error);
      return { labels: [], confidence: {}, method: 'ai' };
    }
  }

  private buildAIPrompt(email: EmailData): string {
    const bodyText = this.getBodyText(email).substring(0, 300);
    const hasUnsubscribe = bodyText.toLowerCase().includes('unsubscribe');
    
    return `Classify this email conservatively. Only assign labels you're VERY confident about.

Categories:
- marketing: ONLY promotional/sales emails with unsubscribe links
- news: ONLY actual newsletters, digests, or news updates
- pitch: ONLY cold outreach trying to sell/propose something  
- social: ONLY notifications from social media platforms
- respond: ONLY if email has a direct question requiring response
- meeting: ONLY if actively scheduling a specific meeting
- signature: ONLY document signature requests
- login: ONLY password resets or verification codes with actual codes

Email:
From: ${email.from?.email}
To: ${email.to.length === 1 ? 'single recipient' : 'multiple recipients'}
Subject: ${email.subject || '(no subject)'}
Preview: ${bodyText}
Has unsubscribe: ${hasUnsubscribe}

Rules:
1. If sender equals recipient, return {"labels": [], "reasoning": "self-email"}
2. If uncertain, return NO label
3. Test/hello emails get NO labels
4. Max 2 labels per email
5. Return confidence scores (0-1) for each label

Return JSON:
{
  "labels": ["category1"],
  "confidence": {"category1": 0.85},
  "reasoning": "one line explanation"
}`;
  }

  private getBodyText(email: EmailData): string {
    if (typeof email.body === 'string') {
      return email.body;
    }
    return email.body?.text || email.body?.snippet || email.body?.html?.replace(/<[^>]*>/g, '') || '';
  }

  private hasHighConfidenceLabels(result: LabelResult): boolean {
    return result.labels.some(label => 
      (result.confidence[label] || 0) >= CONFIDENCE_THRESHOLDS[label]
    );
  }

  private combineResults(pattern: LabelResult, ai: LabelResult): LabelResult {
    const combinedLabels = new Set([...pattern.labels, ...ai.labels]);
    const confidence: Record<string, number> = {};
    
    for (const label of combinedLabels) {
      const patternConf = pattern.confidence[label] || 0;
      const aiConf = ai.confidence[label] || 0;
      // Weighted average, pattern matching gets more weight
      confidence[label] = patternConf * 0.6 + aiConf * 0.4;
    }
    
    return {
      labels: Array.from(combinedLabels),
      confidence,
      reasoning: ai.reasoning,
      method: 'hybrid'
    };
  }

  private filterByConfidence(result: LabelResult): string[] {
    return result.labels.filter(label => {
      const conf = result.confidence[label] || 0;
      const threshold = CONFIDENCE_THRESHOLDS[label] || 0.8;
      return conf >= threshold;
    });
  }

  private async saveLabels(emailId: string, labels: string[], workspaceId: string, userId: string) {
    if (labels.length === 0) return;
    
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
          eq(entities.id, emailId),
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, userId)
        )
      );
  }

  async labelBatch(
    emails: EmailData[], 
    workspaceId: string, 
    userId: string,
    userEmail?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, LabelResult>> {
    const results = new Map<string, LabelResult>();
    
    if (userEmail) {
      this.setCurrentUser(userEmail);
    }
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const result = await this.labelEmail(email, workspaceId, userId);
      results.set(email.id, result);
      
      if (onProgress) {
        onProgress(i + 1, emails.length);
      }
      
      // Small delay to avoid rate limiting
      if (i % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }
}

export const improvedAutoLabelService = new ImprovedAutoLabelService();