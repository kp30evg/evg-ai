/**
 * Email Helper Functions
 * Utilities for processing email commands with real data
 */

import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and, gte, lte, desc, sql, or, ilike } from 'drizzle-orm';
import { entityService } from '@/lib/entities/entity-service';

interface EmailStats {
  total: number;
  unread: number;
  needingResponse: number;
  fromVIPs: number;
}

interface EmailData {
  id: string;
  from: {
    name: string;
    email: string;
  };
  subject: string;
  preview: string;
  timestamp: string;
  isUnread?: boolean;
  needsResponse?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Parse timeframe strings into date ranges
 */
export function parseTimeframe(timeframe: string): { start: Date; end: Date } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeframeLower = timeframe.toLowerCase();
  
  if (timeframeLower.includes('today')) {
    return {
      start: todayStart,
      end: now
    };
  }
  
  if (timeframeLower.includes('yesterday')) {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return {
      start: yesterdayStart,
      end: todayStart
    };
  }
  
  if (timeframeLower.includes('this week') || timeframeLower.includes('week')) {
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return {
      start: weekStart,
      end: now
    };
  }
  
  if (timeframeLower.includes('this month') || timeframeLower.includes('month')) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: monthStart,
      end: now
    };
  }
  
  if (timeframeLower.includes('last week')) {
    const lastWeekEnd = new Date(todayStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    return {
      start: lastWeekStart,
      end: lastWeekEnd
    };
  }
  
  // Default to last 7 days
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return {
    start: weekAgo,
    end: now
  };
}

/**
 * Get database user ID from Clerk user ID
 */
export async function getDatabaseUserId(clerkUserId: string): Promise<string | null> {
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  
  return dbUser?.id || null;
}

/**
 * Fetch emails with user isolation and timeframe
 */
export async function fetchEmails(
  workspaceId: string,
  userId?: string,
  timeframe?: string,
  limit: number = 50
): Promise<any[]> {
  const conditions = [
    eq(entities.workspaceId, workspaceId),
    eq(entities.type, 'email')
  ];
  
  // Add user filter if provided
  if (userId) {
    conditions.push(eq(entities.userId, userId));
  }
  
  // Add timeframe filter
  if (timeframe) {
    const { start, end } = parseTimeframe(timeframe);
    conditions.push(gte(entities.createdAt, start));
    conditions.push(lte(entities.createdAt, end));
  }
  
  const emails = await db
    .select()
    .from(entities)
    .where(and(...conditions))
    .orderBy(desc(entities.createdAt))
    .limit(limit);
  
  return emails;
}

/**
 * Calculate email statistics
 */
export function calculateEmailStats(emails: any[]): EmailStats {
  const stats: EmailStats = {
    total: emails.length,
    unread: 0,
    needingResponse: 0,
    fromVIPs: 0
  };
  
  const vipDomains = ['magicpath.ai', 'anthropic.com', 'google.com', 'microsoft.com'];
  const vipEmails = ['ceo@', 'founder@', 'president@', 'director@'];
  
  for (const email of emails) {
    const data = email.data || {};
    
    // Check if unread (using labels or custom field)
    if (data.labelIds?.includes('UNREAD') || data.isUnread) {
      stats.unread++;
    }
    
    // Check if needs response (basic heuristic)
    const subject = (data.subject || '').toLowerCase();
    const snippet = (data.snippet || '').toLowerCase();
    if (
      subject.includes('urgent') ||
      subject.includes('asap') ||
      subject.includes('?') ||
      snippet.includes('please respond') ||
      snippet.includes('let me know') ||
      snippet.includes('your thoughts')
    ) {
      stats.needingResponse++;
    }
    
    // Check if from VIP
    const fromEmail = data.from?.email || '';
    const fromDomain = fromEmail.split('@')[1];
    
    if (
      vipDomains.includes(fromDomain) ||
      vipEmails.some(vip => fromEmail.startsWith(vip))
    ) {
      stats.fromVIPs++;
    }
  }
  
  return stats;
}

/**
 * Format emails for display
 */
export function formatEmailsForDisplay(emails: any[], maxEmails: number = 5): EmailData[] {
  return emails.slice(0, maxEmails).map(email => {
    const data = email.data || {};
    const from = data.from || {};
    
    // Determine priority
    let priority: 'high' | 'normal' | 'low' = 'normal';
    const subject = (data.subject || '').toLowerCase();
    if (subject.includes('urgent') || subject.includes('asap') || subject.includes('important')) {
      priority = 'high';
    } else if (subject.includes('newsletter') || subject.includes('digest')) {
      priority = 'low';
    }
    
    // Format timestamp
    const timestamp = email.createdAt ? formatTimestamp(new Date(email.createdAt)) : 'Unknown';
    
    return {
      id: email.id,
      from: {
        name: from.name || from.email?.split('@')[0] || 'Unknown',
        email: from.email || 'unknown@email.com'
      },
      subject: data.subject || '(no subject)',
      preview: data.snippet || data.body?.text?.substring(0, 100) || '',
      timestamp,
      isUnread: data.labelIds?.includes('UNREAD') || data.isUnread,
      needsResponse: priority === 'high',
      priority
    };
  });
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Identify important emails
 */
export function identifyImportantEmails(emails: any[]): any[] {
  return emails.filter(email => {
    const data = email.data || {};
    const subject = (data.subject || '').toLowerCase();
    const snippet = (data.snippet || '').toLowerCase();
    const fromEmail = data.from?.email || '';
    
    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'asap', 'important', 'critical', 'immediate'];
    const hasUrgentKeyword = urgentKeywords.some(keyword => 
      subject.includes(keyword) || snippet.includes(keyword)
    );
    
    // Check if from important sender
    const importantDomains = ['magicpath.ai', 'anthropic.com', 'google.com'];
    const fromDomain = fromEmail.split('@')[1];
    const isImportantSender = importantDomains.includes(fromDomain);
    
    // Check if needs response
    const needsResponse = snippet.includes('?') || 
                         snippet.includes('please') ||
                         snippet.includes('let me know');
    
    return hasUrgentKeyword || isImportantSender || needsResponse;
  });
}

/**
 * Get sender analytics
 */
export async function getSenderAnalytics(
  workspaceId: string,
  userId?: string,
  limit: number = 10
): Promise<{ sender: string; count: number; email: string }[]> {
  const conditions = [
    eq(entities.workspaceId, workspaceId),
    eq(entities.type, 'email')
  ];
  
  if (userId) {
    conditions.push(eq(entities.userId, userId));
  }
  
  // Get all emails
  const emails = await db
    .select()
    .from(entities)
    .where(and(...conditions))
    .orderBy(desc(entities.createdAt))
    .limit(500); // Get more emails for better analytics
  
  // Count emails per sender
  const senderCounts = new Map<string, { count: number; name: string }>();
  
  for (const email of emails) {
    const from = email.data?.from;
    if (from?.email) {
      const key = from.email.toLowerCase();
      const current = senderCounts.get(key) || { count: 0, name: from.name || from.email };
      current.count++;
      senderCounts.set(key, current);
    }
  }
  
  // Sort by count and return top senders
  return Array.from(senderCounts.entries())
    .map(([email, data]) => ({
      sender: data.name,
      email,
      count: data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Generate follow-up suggestions based on email context
 */
export function generateFollowUpSuggestions(emails: any[], stats: EmailStats): string[] {
  const suggestions: string[] = [];
  
  if (stats.needingResponse > 0) {
    suggestions.push(`Reply to ${stats.needingResponse} emails needing response`);
  }
  
  if (stats.unread > 5) {
    suggestions.push('Mark all as read');
  }
  
  // Find top sender
  const senderMap = new Map<string, number>();
  for (const email of emails.slice(0, 10)) {
    const fromName = email.data?.from?.name || email.data?.from?.email?.split('@')[0];
    if (fromName) {
      senderMap.set(fromName, (senderMap.get(fromName) || 0) + 1);
    }
  }
  
  if (senderMap.size > 0) {
    const topSender = Array.from(senderMap.entries())
      .sort((a, b) => b[1] - a[1])[0];
    if (topSender[1] > 1) {
      suggestions.push(`Draft response to ${topSender[0]}`);
    }
  }
  
  if (stats.fromVIPs > 0) {
    suggestions.push('Check emails from VIP contacts');
  }
  
  // Default suggestions if none generated
  if (suggestions.length === 0) {
    suggestions.push('Compose new email', 'Check sent emails', 'Open EverMail');
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
}