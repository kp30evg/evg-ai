/**
 * EverCore Module - The Central Nervous System of evergreenOS
 * Autonomous CRM that builds and maintains itself
 */

import { entityService } from '@/lib/entities/entity-service';

// Type definitions for our core entities
export interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string; // NEW: Accept company name as alternative to companyId
  sentimentScore?: number;
  lastContactedAt?: Date;
  source?: 'manual' | 'email' | 'calendar' | 'import';
  socialProfiles?: Record<string, string>;
}

export interface CompanyData {
  name: string;
  domain?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  healthScore?: number;
  description?: string;
  address?: string;
  website?: string;
  parentCompanyId?: string;
}

export interface DealData {
  name: string;
  value: number;
  stage: string;
  closeDate?: Date;
  probability?: number;
  companyId?: string;
  primaryContactId?: string;
  description?: string;
  lostReason?: string;
  wonDate?: Date;
  nextStep?: string;
}

/**
 * Create a contact (person)
 * Automatically creates or links to company if companyName is provided
 */
async function createContactWithData(
  workspaceId: string,
  data: ContactData,
  userId?: string
): Promise<any> {
  // Calculate initial sentiment score if not provided
  if (!data.sentimentScore) {
    data.sentimentScore = 50; // Neutral starting point
  }
  
  // Set last contacted if not provided
  if (!data.lastContactedAt) {
    data.lastContactedAt = new Date();
  }

  let companyId = data.companyId;

  // Handle company name resolution - CRITICAL for interdependent relationships
  if (!companyId && data.companyName && data.companyName.trim()) {
    const companyName = data.companyName.trim();
    
    // First, try to find existing company by name
    const existingCompanies = await entityService.find({
      workspaceId,
      type: 'company',
      search: companyName, // This will search in the company data
      limit: 10
    });

    // Look for exact match (case-insensitive)
    let matchingCompany = existingCompanies.find((company: any) => 
      company.data?.name?.toLowerCase() === companyName.toLowerCase()
    );

    if (matchingCompany) {
      // Company exists - use its ID
      companyId = matchingCompany.id;
      console.log(`🔗 Linking contact to existing company: ${companyName} (${companyId})`);
    } else {
      // Company doesn't exist - create it automatically
      console.log(`🏢 Creating new company: ${companyName}`);
      
      const newCompany = await createCompany(
        workspaceId,
        {
          name: companyName,
          healthScore: 50, // Default health score
        },
        userId
      );
      
      companyId = newCompany.id;
      console.log(`✅ Created company: ${companyName} (${companyId})`);
    }
  }

  // Create the contact with company relationship
  const contact = await entityService.create(
    workspaceId,
    'contact',
    {
      ...data,
      companyId, // Ensure the resolved companyId is stored
    },
    companyId ? { company: companyId } : {},
    { userId, source: data.source || 'manual' }
  );

  // Establish bidirectional relationship with company
  if (companyId) {
    await entityService.link(workspaceId, companyId, contact.id, 'contacts', true);
    console.log(`🔄 Established bidirectional link: Contact ${contact.id} ↔ Company ${companyId}`);
  }

  return contact;
}

/**
 * Create a company
 */
export async function createCompany(
  workspaceId: string,
  data: CompanyData,
  userId?: string
): Promise<any> {
  // Calculate initial health score if not provided
  if (!data.healthScore) {
    data.healthScore = 50; // Neutral starting point
  }

  return await entityService.create(
    workspaceId,
    'company',
    data,
    data.parentCompanyId ? { parentCompany: data.parentCompanyId } : {},
    { userId }
  );
}

/**
 * Create a deal
 */
async function createDealWithData(
  workspaceId: string,
  data: DealData,
  userId?: string
): Promise<any> {
  // Set default probability based on stage if not provided
  if (!data.probability) {
    const stageProbabilities: Record<string, number> = {
      'prospecting': 10,
      'qualification': 20,
      'proposal': 40,
      'negotiation': 60,
      'closing': 80,
      'closed_won': 100,
      'closed_lost': 0
    };
    data.probability = stageProbabilities[data.stage.toLowerCase().replace(' ', '_')] || 50;
  }

  const relationships: Record<string, any> = {};
  if (data.companyId) relationships.company = data.companyId;
  if (data.primaryContactId) relationships.primaryContact = data.primaryContactId;

  const deal = await entityService.create(
    workspaceId,
    'deal',
    data,
    relationships,
    { userId }
  );

  // Link back to company and contact
  if (data.companyId) {
    await entityService.link(workspaceId, data.companyId, deal.id, 'deals');
  }
  if (data.primaryContactId) {
    await entityService.link(workspaceId, data.primaryContactId, deal.id, 'deals');
  }

  return deal;
}

/**
 * Get all contacts with optional filtering
 */
export async function getContacts(
  workspaceId: string,
  filters?: {
    companyId?: string;
    search?: string;
    limit?: number;
  }
): Promise<any[]> {
  const query: any = {
    workspaceId,
    type: 'contact',
    limit: filters?.limit || 100,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  };

  if (filters?.companyId) {
    query.relationships = { company: filters.companyId };
  }
  
  if (filters?.search) {
    query.search = filters.search;
  }

  return await entityService.find(query);
}

/**
 * Get all companies
 */
export async function getCompanies(
  workspaceId: string,
  filters?: {
    search?: string;
    limit?: number;
  }
): Promise<any[]> {
  const query: any = {
    workspaceId,
    type: 'company',
    limit: filters?.limit || 100,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  };

  if (filters?.search) {
    query.search = filters.search;
  }

  return await entityService.find(query);
}

/**
 * Get all deals with optional stage filtering
 */
export async function getDeals(
  workspaceId: string,
  filters?: {
    stage?: string;
    companyId?: string;
    limit?: number;
  }
): Promise<any[]> {
  const query: any = {
    workspaceId,
    type: 'deal',
    limit: filters?.limit || 100,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  };

  if (filters?.stage) {
    query.where = { stage: filters.stage };
  }
  
  if (filters?.companyId) {
    query.relationships = { company: filters.companyId };
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
  const stageProbabilities: Record<string, number> = {
    'prospecting': 10,
    'qualification': 20,
    'proposal': 40,
    'negotiation': 60,
    'closing': 80,
    'closed_won': 100,
    'closed_lost': 0
  };

  const updateData: any = {
    stage: newStage,
    stageChangedAt: new Date(),
    probability: stageProbabilities[newStage.toLowerCase().replace(' ', '_')] || 50
  };

  // If deal is won or lost, set appropriate date
  if (newStage.toLowerCase() === 'closed_won') {
    updateData.wonDate = new Date();
  } else if (newStage.toLowerCase() === 'closed_lost') {
    updateData.lostDate = new Date();
  }

  return await entityService.update(workspaceId, dealId, updateData);
}

/**
 * Get complete 360-degree view of a contact
 */
export async function getContactInsights(
  workspaceId: string,
  contactId: string
): Promise<any> {
  const contact = await entityService.findById(workspaceId, contactId);
  if (!contact) return null;

  // Get all related entities
  const related = await entityService.findRelated(workspaceId, contactId);
  
  // Get company if linked
  let company = null;
  if (contact.relationships?.company) {
    company = await entityService.findById(workspaceId, contact.relationships.company);
  }

  // Categorize related entities
  const emails = related.filter(e => e.type === 'email');
  const meetings = related.filter(e => e.type === 'calendar_event' || e.type === 'meeting');
  const messages = related.filter(e => e.type === 'message');
  const tasks = related.filter(e => e.type === 'task');
  const deals = related.filter(e => e.type === 'deal');

  // Calculate engagement metrics
  const lastEmail = emails.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  
  const lastMeeting = meetings.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const daysSinceLastContact = lastEmail || lastMeeting
    ? Math.floor((Date.now() - new Date((lastEmail || lastMeeting).createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    contact,
    company,
    metrics: {
      totalEmails: emails.length,
      totalMeetings: meetings.length,
      totalMessages: messages.length,
      totalTasks: tasks.length,
      totalDeals: deals.length,
      daysSinceLastContact,
      engagementScore: calculateEngagementScore(emails, meetings, messages),
    },
    recentActivity: [...emails, ...meetings, ...messages, ...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    deals,
    timeline: [...related].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  };
}

/**
 * Get complete view of a company including all contacts and deals
 */
export async function getCompanyInsights(
  workspaceId: string,
  companyId: string
): Promise<any> {
  const company = await entityService.findById(workspaceId, companyId);
  if (!company) return null;

  // Get all contacts at this company  
  const contacts = await getContacts(workspaceId, { companyId, userId: undefined }); // Company insights should see all contacts
  
  // Get all deals for this company
  const deals = await getDeals(workspaceId, { companyId, userId: undefined }); // Company insights should see all deals
  
  // Get all related entities
  const related = await entityService.findRelated(workspaceId, companyId);

  // Calculate metrics
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.data.value || 0), 0);
  const openDealValue = deals
    .filter(d => !['closed_won', 'closed_lost'].includes(d.data.stage?.toLowerCase()))
    .reduce((sum, deal) => sum + (deal.data.value || 0), 0);
  const wonDealValue = deals
    .filter(d => d.data.stage?.toLowerCase() === 'closed_won')
    .reduce((sum, deal) => sum + (deal.data.value || 0), 0);

  return {
    company,
    contacts,
    deals,
    metrics: {
      totalContacts: contacts.length,
      totalDeals: deals.length,
      totalDealValue,
      openDealValue,
      wonDealValue,
      healthScore: company.data.healthScore || 50,
    },
    relatedEntities: related,
  };
}

/**
 * Automatically create contacts and companies from email entities
 * This is the magic - the autonomous engine
 */
export async function autoCreateFromEmail(
  workspaceId: string,
  emailEntity: any
): Promise<{ contact?: any, company?: any }> {
  const result: { contact?: any, company?: any } = {};
  
  // Extract email address and domain
  const fromEmail = emailEntity.data.from?.email || emailEntity.data.from;
  if (!fromEmail || typeof fromEmail !== 'string') return result;

  const domain = fromEmail.split('@')[1];
  const fromName = emailEntity.data.from?.name || '';
  
  // Check if contact already exists
  const existingContacts = await entityService.find({
    workspaceId,
    type: 'contact',
    where: { email: fromEmail },
    limit: 1
  });

  if (existingContacts.length === 0) {
    // Parse name from email or signature
    const [firstName, ...lastNameParts] = fromName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    // First, check if company exists for this domain
    let companyId = null;
    if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
      const existingCompanies = await entityService.find({
        workspaceId,
        type: 'company',
        where: { domain },
        limit: 1
      });

      if (existingCompanies.length === 0) {
        // Create company
        const company = await createCompany(workspaceId, {
          name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          domain,
          healthScore: 50
        });
        result.company = company;
        companyId = company.id;
      } else {
        companyId = existingCompanies[0].id;
      }
    }

    // Create contact
    const contact = await createContactWithData(workspaceId, {
      firstName: firstName || fromEmail.split('@')[0],
      lastName: lastName || '',
      email: fromEmail,
      companyId,
      source: 'email',
      sentimentScore: 50
    });
    
    result.contact = contact;
    
    // Link email to contact
    await entityService.link(workspaceId, emailEntity.id, contact.id, 'from_contact');
  } else {
    // Update last contacted date
    await entityService.update(workspaceId, existingContacts[0].id, {
      lastContactedAt: new Date()
    });
    
    // Link email to existing contact
    await entityService.link(workspaceId, emailEntity.id, existingContacts[0].id, 'from_contact');
  }

  return result;
}

/**
 * Calculate engagement score based on activity
 */
function calculateEngagementScore(
  emails: any[],
  meetings: any[],
  messages: any[]
): number {
  const now = Date.now();
  const dayInMs = 1000 * 60 * 60 * 24;
  
  // Weight recent activities more heavily
  let score = 50; // Start neutral
  
  // Recent emails (last 30 days)
  const recentEmails = emails.filter(e => 
    (now - new Date(e.createdAt).getTime()) < 30 * dayInMs
  );
  score += recentEmails.length * 2;
  
  // Recent meetings (last 30 days)  
  const recentMeetings = meetings.filter(m =>
    (now - new Date(m.createdAt).getTime()) < 30 * dayInMs
  );
  score += recentMeetings.length * 5;
  
  // Recent messages (last 7 days)
  const recentMessages = messages.filter(m =>
    (now - new Date(m.createdAt).getTime()) < 7 * dayInMs
  );
  score += recentMessages.length * 1;
  
  // Cap at 100
  return Math.min(100, score);
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

  // Create contact
  if (lowerCommand.includes('create contact') || lowerCommand.includes('add contact')) {
    const match = command.match(/(?:create|add)\s+contact\s+(.+?)(?:\s+at\s+(.+?))?(?:\s+email\s+(.+))?$/i);
    if (match) {
      const fullName = match[1];
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      return await createContactWithData(workspaceId, {
        firstName,
        lastName,
        email: match[3] || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      }, userId);
    }
  }

  // Create company
  if (lowerCommand.includes('create company') || lowerCommand.includes('add company')) {
    const match = command.match(/(?:create|add)\s+company\s+(.+)/i);
    if (match) {
      return await createCompany(workspaceId, {
        name: match[1],
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

  // Show contacts
  if (lowerCommand.includes('show contacts') || lowerCommand.includes('list contacts')) {
    return await getContacts(workspaceId);
  }

  // Summarize contacts
  if (lowerCommand.includes('summarize') && lowerCommand.includes('contact')) {
    const contacts = await getContacts(workspaceId);
    
    if (contacts.length === 0) {
      return {
        message: 'You have no contacts yet. Start by adding some contacts to your CRM.',
        contacts: [],
        suggestions: ['Create a new contact', 'Import contacts from Gmail']
      };
    }
    
    // Group contacts by company
    const byCompany: Record<string, any[]> = {};
    const noCompany: any[] = [];
    
    for (const contact of contacts) {
      const companyName = contact.data.companyName || (contact.data.companyId ? 'Unknown Company' : null);
      if (companyName) {
        if (!byCompany[companyName]) {
          byCompany[companyName] = [];
        }
        byCompany[companyName].push(contact);
      } else {
        noCompany.push(contact);
      }
    }
    
    return {
      message: `You have ${contacts.length} total contacts`,
      totalContacts: contacts.length,
      byCompany,
      withoutCompany: noCompany.length,
      recentContacts: contacts.slice(0, 5).map(c => ({
        name: `${c.data.firstName} ${c.data.lastName}`.trim(),
        email: c.data.email,
        company: c.data.companyName || 'No company'
      })),
      suggestions: ['Show contacts with high deal potential', 'Create a new contact', 'Show all deals']
    };
  }

  // Show companies
  if (lowerCommand.includes('show companies') || lowerCommand.includes('list companies')) {
    return await getCompanies(workspaceId);
  }

  // Show deals/pipeline
  if (lowerCommand.includes('show deals') || lowerCommand.includes('show pipeline') || lowerCommand.includes('list deals')) {
    const stageMatch = command.match(/(?:in|at|stage)\s+(\w+)/i);
    return await getDeals(workspaceId, stageMatch ? { stage: stageMatch[1] } : undefined);
  }

  // What's my biggest deal
  if (lowerCommand.includes('biggest deal') || lowerCommand.includes('largest deal') || lowerCommand.includes('top deal')) {
    const deals = await getDeals(workspaceId);
    
    if (deals.length === 0) {
      return {
        message: 'You have no deals in your pipeline yet. Start by creating a new deal.',
        suggestions: ['Create a new deal', 'Add a contact', 'Import data from CRM']
      };
    }
    
    // Sort by value and get the biggest
    const sortedDeals = deals.sort((a, b) => (b.data.value || 0) - (a.data.value || 0));
    const biggestDeal = sortedDeals[0];
    
    // Get related contact and company info if available
    let contactName = 'No contact assigned';
    let companyName = 'No company assigned';
    
    if (biggestDeal.relationships?.primaryContact) {
      const contact = await entityService.findById(workspaceId, biggestDeal.relationships.primaryContact);
      if (contact) {
        contactName = `${contact.data.firstName} ${contact.data.lastName}`.trim();
      }
    }
    
    if (biggestDeal.relationships?.company) {
      const company = await entityService.findById(workspaceId, biggestDeal.relationships.company);
      if (company) {
        companyName = company.data.name;
      }
    }
    
    return {
      deal: biggestDeal,
      message: `Your biggest deal is "${biggestDeal.data.name}" worth $${(biggestDeal.data.value || 0).toLocaleString()}`,
      details: {
        name: biggestDeal.data.name,
        value: biggestDeal.data.value || 0,
        stage: biggestDeal.data.stage || 'Unknown',
        probability: biggestDeal.data.probability || 0,
        contact: contactName,
        company: companyName,
        closeDate: biggestDeal.data.closeDate,
        nextStep: biggestDeal.data.nextStep || 'No next step defined'
      },
      otherTopDeals: sortedDeals.slice(1, 4).map(d => ({
        name: d.data.name,
        value: d.data.value || 0,
        stage: d.data.stage
      })),
      suggestions: ['Show deals at risk', 'Update deal stage', 'Show all deals']
    };
  }

  // EverCore specific commands
  if (lowerCommand.includes('high deal potential') || lowerCommand.includes('contacts with high deal potential')) {
    // Ensure we have some sample data for demonstration
    await ensureSampleData(workspaceId, userId);
    
    const contacts = await getContacts(workspaceId, { limit: 20, userId });
    const deals = await getDeals(workspaceId, { userId });
    
    // Calculate deal potential based on contact engagement and existing deal values
    const contactsWithPotential = contacts.map(contact => {
      const contactDeals = deals.filter(deal => deal.relationships?.primaryContact === contact.id);
      const totalDealValue = contactDeals.reduce((sum, deal) => sum + (deal.data.value || 0), 0);
      const avgDealValue = contactDeals.length > 0 ? totalDealValue / contactDeals.length : 0;
      const engagementScore = contact.data.sentimentScore || 50;
      
      return {
        ...contact,
        dealPotential: (engagementScore * 0.6) + (Math.min(avgDealValue / 1000, 40)), // Combined score
        totalDealValue,
        dealCount: contactDeals.length
      };
    })
    .filter(c => c.dealPotential > 60) // High potential threshold
    .sort((a, b) => b.dealPotential - a.dealPotential)
    .slice(0, 10);

    return {
      contacts: contactsWithPotential,
      message: `Found ${contactsWithPotential.length} contacts with high deal potential`,
      totalContacts: contacts.length
    };
  }

  if (lowerCommand.includes('deals at risk')) {
    await ensureSampleData(workspaceId, userId);
    const deals = await getDeals(workspaceId);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    const atRiskDeals = deals.filter(deal => {
      const daysSinceCreated = (now - new Date(deal.createdAt).getTime()) / dayInMs;
      const isStagnant = daysSinceCreated > 30 && deal.data.stage !== 'closed_won' && deal.data.stage !== 'closed_lost';
      const hasCloseDate = deal.data.closeDate;
      const isPastDue = hasCloseDate && new Date(deal.data.closeDate) < new Date();
      const lowProbability = (deal.data.probability || 0) < 30;
      
      return isStagnant || isPastDue || lowProbability;
    })
    .sort((a, b) => (b.data.value || 0) - (a.data.value || 0))
    .slice(0, 10);

    return {
      deals: atRiskDeals,
      message: `Found ${atRiskDeals.length} deals at risk this month`,
      totalValue: atRiskDeals.reduce((sum, deal) => sum + (deal.data.value || 0), 0)
    };
  }

  if (lowerCommand.includes('health score') || lowerCommand.includes('account health')) {
    await ensureSampleData(workspaceId, userId);
    const companies = await getCompanies(workspaceId);
    const accountHealth = companies.map(company => ({
      ...company,
      healthScore: company.data.healthScore || 50
    }))
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 10);

    return {
      accounts: accountHealth,
      message: `Top ${accountHealth.length} accounts by health score`,
      avgHealthScore: accountHealth.reduce((sum, acc) => sum + acc.healthScore, 0) / accountHealth.length
    };
  }

  if (lowerCommand.includes('follow-up tasks') || lowerCommand.includes('pipeline tasks')) {
    await ensureSampleData(workspaceId, userId);
    const deals = await getDeals(workspaceId);
    const contacts = await getContacts(workspaceId);
    
    // Generate AI-powered follow-up tasks based on deal stages and contact engagement
    const tasks = [];
    
    // Add tasks for deals in negotiation stage
    const negotiationDeals = deals.filter(d => d.data.stage?.toLowerCase().includes('negotiation'));
    negotiationDeals.forEach(deal => {
      tasks.push({
        type: 'follow_up_call',
        title: `Follow up on ${deal.data.name} negotiation`,
        priority: 'high',
        dealId: deal.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      });
    });
    
    // Add tasks for stagnant contacts
    const stagnantContacts = contacts.filter(c => {
      const lastContactedDays = c.data.lastContactedAt 
        ? (Date.now() - new Date(c.data.lastContactedAt).getTime()) / (24 * 60 * 60 * 1000)
        : 999;
      return lastContactedDays > 14;
    }).slice(0, 5);
    
    stagnantContacts.forEach(contact => {
      tasks.push({
        type: 'check_in',
        title: `Check in with ${contact.data.firstName} ${contact.data.lastName}`,
        priority: 'medium',
        contactId: contact.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });
    });

    return {
      tasks: tasks.slice(0, 10),
      message: `Generated ${tasks.length} follow-up tasks for your pipeline`,
      breakdown: {
        dealFollowUps: negotiationDeals.length,
        contactCheckIns: stagnantContacts.length
      }
    };
  }

  // Get insights about a contact
  if (lowerCommand.includes('everything about') || lowerCommand.includes('show me')) {
    const match = command.match(/(?:everything about|show me|tell me about)\s+(.+)/i);
    if (match) {
      const searchTerm = match[1].trim();
      
      // First try to find as a contact
      const contacts = await entityService.find({
        workspaceId,
        type: 'contact',
        search: searchTerm,
        limit: 1
      });
      
      if (contacts.length > 0) {
        return await getContactInsights(workspaceId, contacts[0].id);
      }
      
      // Try as a company
      const companies = await entityService.find({
        workspaceId,
        type: 'company',
        search: searchTerm,
        limit: 1
      });
      
      if (companies.length > 0) {
        return await getCompanyInsights(workspaceId, companies[0].id);
      }
    }
  }

  return {
    error: 'Command not recognized',
    suggestions: [
      'Show me my EverCore contacts with high deal potential',
      'Which EverCore deals are at risk this month?',
      'Generate follow-up tasks for my pipeline',
      "What's the health score of my top accounts?",
      'create contact [name]',
      'create company [name]',
      'show contacts',
      'show companies',
      'show pipeline'
    ],
  };
}

/**
 * Ensure sample data exists for demonstration purposes
 */
async function ensureSampleData(workspaceId: string, userId?: string): Promise<void> {
  const existingContacts = await getContacts(workspaceId, { limit: 1 });
  if (existingContacts.length > 0) return; // Data already exists
  
  try {
    // Create sample companies
    const acmeInc = await createCompany(workspaceId, {
      name: 'Acme Inc',
      domain: 'acme.com',
      industry: 'Technology',
      employeeCount: 500,
      annualRevenue: 10000000,
      healthScore: 85
    }, userId);

    const techCorp = await createCompany(workspaceId, {
      name: 'TechCorp Solutions',
      domain: 'techcorp.com', 
      industry: 'Software',
      employeeCount: 1200,
      annualRevenue: 25000000,
      healthScore: 72
    }, userId);

    const innovateLabs = await createCompany(workspaceId, {
      name: 'Innovate Labs',
      domain: 'innovatelabs.io',
      industry: 'AI/ML',
      employeeCount: 150,
      annualRevenue: 5000000,
      healthScore: 91
    }, userId);

    // Create sample contacts
    const johnDoe = await createContact(workspaceId, {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@acme.com',
      phone: '+1-555-0123',
      jobTitle: 'VP of Sales',
      companyId: acmeInc.id,
      sentimentScore: 82,
      lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      source: 'manual'
    }, userId);

    const sarahWilson = await createContact(workspaceId, {
      firstName: 'Sarah',
      lastName: 'Wilson', 
      email: 'sarah.wilson@techcorp.com',
      phone: '+1-555-0456',
      jobTitle: 'CTO',
      companyId: techCorp.id,
      sentimentScore: 95,
      lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      source: 'email'
    }, userId);

    const mikeChang = await createContact(workspaceId, {
      firstName: 'Mike',
      lastName: 'Chang',
      email: 'mike.chang@innovatelabs.io',
      phone: '+1-555-0789',
      jobTitle: 'Head of Product',
      companyId: innovateLabs.id,
      sentimentScore: 78,
      lastContactedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      source: 'calendar'
    }, userId);

    const emilyBrown = await createContact(workspaceId, {
      firstName: 'Emily',
      lastName: 'Brown',
      email: 'emily.brown@acme.com',
      phone: '+1-555-0321',
      jobTitle: 'Director of Operations',
      companyId: acmeInc.id,
      sentimentScore: 65,
      lastContactedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      source: 'import'
    }, userId);

    // Create sample deals
    await createDealWithData(workspaceId, {
      name: 'Enterprise CRM Implementation',
      value: 85000,
      stage: 'negotiation',
      closeDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      probability: 75,
      companyId: acmeInc.id,
      primaryContactId: johnDoe.id,
      description: 'Large-scale CRM implementation for sales team',
      nextStep: 'Schedule final demo with executives'
    }, userId);

    await createDealWithData(workspaceId, {
      name: 'AI Platform Integration',
      value: 150000,
      stage: 'proposal',
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      probability: 60,
      companyId: innovateLabs.id,
      primaryContactId: mikeChang.id,
      description: 'Custom AI platform integration project',
      nextStep: 'Finalize technical requirements'
    }, userId);

    await createDealWithData(workspaceId, {
      name: 'Cloud Migration Services', 
      value: 120000,
      stage: 'closing',
      closeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      probability: 90,
      companyId: techCorp.id,
      primaryContactId: sarahWilson.id,
      description: 'Complete cloud infrastructure migration',
      nextStep: 'Contract review and signatures'
    }, userId);

    // Create a deal at risk
    await createDealWithData(workspaceId, {
      name: 'Legacy System Upgrade',
      value: 45000,
      stage: 'qualification',
      closeDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days past due
      probability: 25,
      companyId: acmeInc.id,
      primaryContactId: emilyBrown.id,
      description: 'Upgrade legacy systems - project stalled',
      nextStep: 'Re-engage stakeholders'
    }, userId);

  } catch (error) {
    console.warn('Error creating sample data:', error);
    // Don't throw - sample data creation failing shouldn't break the command
  }
}

// Export the simple wrapper functions as the main API
export async function createContact(
  workspaceId: string,
  firstName: string,
  lastName: string,
  email: string,
  companyName?: string,
  userId?: string
): Promise<any> {
  return createContactWithData(workspaceId, {
    firstName,
    lastName,
    email,
    companyName
  }, userId);
}

export async function createDeal(
  workspaceId: string,
  name: string,
  value: number,
  stage: string,
  userId?: string
): Promise<any> {
  return createDealWithData(workspaceId, {
    name,
    value,
    stage
  }, userId);
}