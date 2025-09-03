/**
 * EverCore Module - CRM functionality using EntityService
 * Simple functions for managing customers, deals, contacts
 */

import { entityService } from '@/lib/entities/entity-service';
import { CustomerData } from '@/lib/db/schema/unified';

/**
 * Create a customer
 */
export async function createCustomer(
  workspaceId: string,
  data: CustomerData,
  userId?: string
): Promise<any> {
  return await entityService.create(
    workspaceId,
    'customer',
    data,
    {},
    { userId }
  );
}

/**
 * Create a deal
 */
export async function createDeal(
  workspaceId: string,
  data: {
    name: string;
    value: number;
    stage: string;
    customerId?: string;
    probability?: number;
    expectedCloseDate?: Date;
  },
  userId?: string
): Promise<any> {
  const deal = await entityService.create(
    workspaceId,
    'deal',
    data,
    data.customerId ? { customer: data.customerId } : {},
    { userId }
  );

  // If linked to customer, update customer's relationships
  if (data.customerId) {
    await entityService.link(workspaceId, data.customerId, deal.id, 'deals');
  }

  return deal;
}

/**
 * Get all customers
 */
export async function getCustomers(
  workspaceId: string,
  limit = 100
): Promise<any[]> {
  return await entityService.find({
    workspaceId,
    type: 'customer',
    limit,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });
}

/**
 * Get all deals
 */
export async function getDeals(
  workspaceId: string,
  stage?: string,
  limit = 100
): Promise<any[]> {
  const query: any = {
    workspaceId,
    type: 'deal',
    limit,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  };

  if (stage) {
    query.where = { stage };
  }

  return await entityService.find(query);
}

/**
 * Update deal stage
 */
export async function updateDealStage(
  workspaceId: string,
  dealId: string,
  newStage: string
): Promise<any> {
  return await entityService.update(
    workspaceId,
    dealId,
    {
      stage: newStage,
      stageChangedAt: new Date(),
    }
  );
}

/**
 * Find everything about a customer
 */
export async function getCustomerInsights(
  workspaceId: string,
  customerId: string
): Promise<any> {
  const customer = await entityService.findById(workspaceId, customerId);
  if (!customer) return null;

  // Get all related entities
  const related = await entityService.findRelated(workspaceId, customerId);
  
  // Also search for mentions in other entities
  const customerName = customer.data.name || customer.data.email;
  const mentions = await entityService.find({
    workspaceId,
    search: customerName,
    limit: 100,
  });

  return {
    customer,
    relatedEntities: related,
    mentions: mentions.filter(e => e.id !== customerId),
    summary: {
      totalDeals: related.filter(e => e.type === 'deal').length,
      totalEmails: related.filter(e => e.type === 'email').length,
      totalTasks: related.filter(e => e.type === 'task').length,
      totalInvoices: related.filter(e => e.type === 'invoice').length,
    },
  };
}

/**
 * Analyze why a deal was lost
 */
export async function analyzeLostDeal(
  workspaceId: string,
  dealId: string
): Promise<any> {
  const deal = await entityService.findById(workspaceId, dealId);
  if (!deal) return null;

  // Get all related entities
  const related = await entityService.findRelated(workspaceId, dealId);
  
  // Categorize related entities
  const emails = related.filter(e => e.type === 'email');
  const messages = related.filter(e => e.type === 'message');
  const tasks = related.filter(e => e.type === 'task');
  const meetings = related.filter(e => e.type === 'meeting');

  // Simple analysis (in production, use AI)
  const incompleteTasks = tasks.filter(t => t.data.status !== 'completed');
  const lastActivity = [...emails, ...messages, ...meetings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return {
    deal,
    analysis: {
      totalInteractions: emails.length + messages.length + meetings.length,
      incompleteTasks: incompleteTasks.length,
      lastActivityDaysAgo: lastActivity 
        ? Math.floor((Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      emailsSent: emails.filter(e => e.data.from === 'us').length,
      emailsReceived: emails.filter(e => e.data.from !== 'us').length,
    },
    timeline: [...related].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  };
}

/**
 * Handle natural language commands for CRM
 */
export async function handleCoreCommand(
  workspaceId: string,
  command: string,
  userId?: string
): Promise<any> {
  const lowerCommand = command.toLowerCase();

  // Create customer
  if (lowerCommand.includes('create customer') || lowerCommand.includes('add customer')) {
    const match = command.match(/(?:create|add)\s+customer\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+email\s+(.+))?$/i);
    if (match) {
      return await createCustomer(workspaceId, {
        name: match[1],
        company: match[2] || undefined,
        email: match[3] || undefined,
      }, userId);
    }
  }

  // Create deal
  if (lowerCommand.includes('create deal') || lowerCommand.includes('add deal')) {
    const match = command.match(/(?:create|add)\s+deal\s+(.+?)\s+(?:for|worth)\s+\$?([\d,]+)/i);
    if (match) {
      return await createDeal(workspaceId, {
        name: match[1],
        value: parseFloat(match[2].replace(/,/g, '')),
        stage: 'prospecting',
      }, userId);
    }
  }

  // Show customers
  if (lowerCommand.includes('show customers') || lowerCommand.includes('list customers')) {
    return await getCustomers(workspaceId);
  }

  // Show deals
  if (lowerCommand.includes('show deals') || lowerCommand.includes('list deals')) {
    const stageMatch = command.match(/(?:in|at|stage)\s+(\w+)/i);
    return await getDeals(workspaceId, stageMatch ? stageMatch[1] : undefined);
  }

  // Analyze lost deal
  if (lowerCommand.includes('why') && lowerCommand.includes('lose')) {
    const match = command.match(/(?:lose|lost)\s+(?:the\s+)?(.+?)(?:\s+deal)?/i);
    if (match) {
      // Find the deal by name
      const deals = await entityService.find({
        workspaceId,
        type: 'deal',
        where: { name: match[1] },
        limit: 1,
      });
      if (deals.length > 0) {
        return await analyzeLostDeal(workspaceId, deals[0].id);
      }
    }
  }

  return {
    error: 'Command not recognized',
    suggestions: [
      'create customer [name]',
      'create deal [name] for $[amount]',
      'show customers',
      'show deals',
      'why did we lose [deal name]',
    ],
  };
}