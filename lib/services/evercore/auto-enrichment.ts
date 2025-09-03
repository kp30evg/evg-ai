/**
 * Auto-Enrichment Engine - Autonomous data enrichment for companies and contacts
 * Automatically pulls data from multiple sources to build rich profiles
 * Zero manual data entry required
 */

import { entityService } from '@/lib/entities/entity-service';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnrichmentSource {
  name: string;
  type: 'api' | 'scraper' | 'ai' | 'internal';
  priority: number; // Lower is higher priority
  fields: string[]; // Which fields this source can provide
}

export interface CompanyEnrichmentData {
  // Basic Info
  name?: string;
  domain?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  
  // Company Size
  employeeCount?: number;
  employeeRange?: string;
  
  // Financials
  annualRevenue?: number;
  revenueRange?: string;
  fundingTotal?: number;
  lastFundingAmount?: number;
  lastFundingDate?: Date;
  fundingStage?: string;
  investors?: string[];
  
  // Location
  headquarters?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  locations?: any[];
  
  // Online Presence
  website?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    crunchbase?: string;
    angellist?: string;
  };
  
  // Business Details
  yearFounded?: number;
  type?: string; // Public, Private, Non-profit
  ticker?: string; // Stock ticker if public
  naicsCode?: string;
  sicCode?: string;
  
  // Technology Stack
  technologies?: string[];
  
  // Key People
  executives?: Array<{
    name: string;
    title: string;
    linkedin?: string;
  }>;
  
  // Metadata
  enrichedAt?: Date;
  enrichmentSources?: string[];
  dataQuality?: number; // 0-100 score
}

export interface ContactEnrichmentData {
  // Personal Info
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  emailVerified?: boolean;
  
  // Professional
  jobTitle?: string;
  seniority?: string; // Junior, Senior, Executive, etc.
  department?: string;
  role?: string;
  
  // Contact Info
  phone?: string;
  phoneType?: string; // Mobile, Work, etc.
  
  // Location
  location?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  
  // Social Profiles
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  
  // Professional History
  experience?: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }>;
  
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    graduationYear?: number;
  }>;
  
  // Skills & Interests
  skills?: string[];
  interests?: string[];
  
  // Metadata
  enrichedAt?: Date;
  enrichmentSources?: string[];
  dataQuality?: number;
}

/**
 * Enrich company data from multiple sources
 */
export async function enrichCompany(
  workspaceId: string,
  companyId: string,
  domain?: string
): Promise<CompanyEnrichmentData> {
  const company = await entityService.findById(workspaceId, companyId);
  if (!company || company.type !== 'company') {
    throw new Error('Company not found');
  }
  
  const enrichmentData: CompanyEnrichmentData = {
    name: company.data.name,
    domain: domain || company.data.domain
  };
  
  // Use domain to enrich
  if (enrichmentData.domain) {
    // 1. Extract from internal data (emails, calendar events)
    const internalData = await enrichFromInternalData(workspaceId, enrichmentData.domain);
    Object.assign(enrichmentData, internalData);
    
    // 2. Use AI to infer data from domain and existing info
    const aiEnriched = await enrichWithAI(enrichmentData);
    Object.assign(enrichmentData, aiEnriched);
    
    // 3. Mock external API enrichment (would use real APIs in production)
    const apiData = await mockApiEnrichment(enrichmentData.domain);
    Object.assign(enrichmentData, apiData);
  }
  
  // Calculate data quality score
  enrichmentData.dataQuality = calculateDataQuality(enrichmentData);
  enrichmentData.enrichedAt = new Date();
  enrichmentData.enrichmentSources = ['internal', 'ai', 'api'];
  
  // Update company with enriched data
  await entityService.update(workspaceId, companyId, {
    ...company.data,
    ...enrichmentData,
    enrichedAt: new Date()
  });
  
  // Create enrichment event
  await entityService.create(
    workspaceId,
    'enrichment_event',
    {
      entityId: companyId,
      entityType: 'company',
      fieldsEnriched: Object.keys(enrichmentData).length,
      dataQuality: enrichmentData.dataQuality,
      sources: enrichmentData.enrichmentSources
    },
    { company: companyId },
    { system: true }
  );
  
  return enrichmentData;
}

/**
 * Enrich contact data
 */
export async function enrichContact(
  workspaceId: string,
  contactId: string,
  email?: string
): Promise<ContactEnrichmentData> {
  const contact = await entityService.findById(workspaceId, contactId);
  if (!contact || contact.type !== 'contact') {
    throw new Error('Contact not found');
  }
  
  const enrichmentData: ContactEnrichmentData = {
    firstName: contact.data.firstName,
    lastName: contact.data.lastName,
    email: email || contact.data.email
  };
  
  if (enrichmentData.email) {
    // 1. Extract from internal communications
    const internalData = await enrichContactFromInternal(workspaceId, enrichmentData.email);
    Object.assign(enrichmentData, internalData);
    
    // 2. Use AI to infer additional data
    const aiEnriched = await enrichContactWithAI(enrichmentData);
    Object.assign(enrichmentData, aiEnriched);
    
    // 3. Mock external enrichment
    const apiData = await mockContactApiEnrichment(enrichmentData.email);
    Object.assign(enrichmentData, apiData);
  }
  
  enrichmentData.dataQuality = calculateDataQuality(enrichmentData);
  enrichmentData.enrichedAt = new Date();
  enrichmentData.enrichmentSources = ['internal', 'ai', 'api'];
  
  // Update contact
  await entityService.update(workspaceId, contactId, {
    ...contact.data,
    ...enrichmentData,
    enrichedAt: new Date()
  });
  
  return enrichmentData;
}

/**
 * Extract company data from internal sources (emails, meetings, etc.)
 */
async function enrichFromInternalData(
  workspaceId: string,
  domain: string
): Promise<Partial<CompanyEnrichmentData>> {
  const enriched: Partial<CompanyEnrichmentData> = {};
  
  // Find all emails from this domain
  const emails = await entityService.find({
    workspaceId,
    type: 'email',
    where: {
      $or: [
        { 'data.from': { $like: `%@${domain}` } },
        { 'data.to': { $contains: `@${domain}` } }
      ]
    },
    limit: 100
  });
  
  // Extract signatures and analyze
  const signatures = emails
    .map(e => extractSignature(e.data.body || e.data.content || ''))
    .filter(Boolean);
  
  if (signatures.length > 0) {
    // Extract common patterns from signatures
    const addresses = signatures.map(s => extractAddress(s)).filter(Boolean);
    if (addresses.length > 0) {
      // Most common address is likely headquarters
      enriched.headquarters = getMostCommon(addresses);
    }
    
    // Extract phone numbers
    const phones = signatures.map(s => extractPhone(s)).filter(Boolean);
    
    // Extract job titles to infer company size
    const titles = signatures.map(s => extractTitle(s)).filter(Boolean);
    enriched.employeeRange = inferCompanySize(titles);
  }
  
  // Analyze meeting patterns
  const meetings = await entityService.find({
    workspaceId,
    type: 'calendar_event',
    where: {
      'data.attendees': { $contains: `@${domain}` }
    },
    limit: 50
  });
  
  // Extract insights from meeting titles and descriptions
  if (meetings.length > 0) {
    const topics = meetings.map(m => m.data.title + ' ' + (m.data.description || '')).join(' ');
    enriched.technologies = extractTechnologies(topics);
  }
  
  return enriched;
}

/**
 * Use AI to enrich company data
 */
async function enrichWithAI(
  data: CompanyEnrichmentData
): Promise<Partial<CompanyEnrichmentData>> {
  if (!data.domain) return {};
  
  try {
    const prompt = `
      Given the company domain: ${data.domain}
      ${data.name ? `Company name: ${data.name}` : ''}
      
      Infer the following (return as JSON):
      1. Industry and sub-industry
      2. Likely employee range (e.g., 1-10, 11-50, 51-200, etc.)
      3. Company type (B2B, B2C, B2B2C)
      4. Likely technologies used
      5. Target market
      
      Base this on the domain name and any patterns you recognize.
      Return only factual inferences with high confidence.
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a business intelligence analyst. Provide accurate inferences based on company domains.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const aiData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      industry: aiData.industry,
      subIndustry: aiData.subIndustry,
      employeeRange: aiData.employeeRange,
      type: aiData.companyType,
      technologies: aiData.technologies || []
    };
  } catch (error) {
    console.error('AI enrichment failed:', error);
    return {};
  }
}

/**
 * Enrich contact from internal data
 */
async function enrichContactFromInternal(
  workspaceId: string,
  email: string
): Promise<Partial<ContactEnrichmentData>> {
  const enriched: Partial<ContactEnrichmentData> = {};
  
  // Find all emails from/to this person
  const emails = await entityService.find({
    workspaceId,
    type: 'email',
    where: {
      $or: [
        { 'data.from': email },
        { 'data.to': { $contains: email } }
      ]
    },
    limit: 50
  });
  
  if (emails.length > 0) {
    // Extract signature from sent emails
    const sentEmails = emails.filter(e => e.data.from === email);
    if (sentEmails.length > 0) {
      const signature = extractSignature(sentEmails[0].data.body || '');
      if (signature) {
        enriched.jobTitle = extractTitle(signature);
        enriched.phone = extractPhone(signature);
      }
    }
    
    // Analyze email patterns for seniority
    enriched.seniority = inferSeniority(emails);
    
    // Extract timezone from email send times
    enriched.location = {
      timezone: inferTimezone(emails)
    };
  }
  
  // Check calendar events
  const meetings = await entityService.find({
    workspaceId,
    type: 'calendar_event',
    where: {
      'data.attendees': { $contains: email }
    },
    limit: 20
  });
  
  if (meetings.length > 0) {
    // Infer role from meeting types
    enriched.role = inferRole(meetings);
  }
  
  return enriched;
}

/**
 * Use AI to enrich contact data
 */
async function enrichContactWithAI(
  data: ContactEnrichmentData
): Promise<Partial<ContactEnrichmentData>> {
  if (!data.email) return {};
  
  const domain = data.email.split('@')[1];
  
  try {
    const prompt = `
      Given the email: ${data.email}
      ${data.firstName ? `Name: ${data.firstName} ${data.lastName}` : ''}
      ${data.jobTitle ? `Title: ${data.jobTitle}` : ''}
      
      Infer the following (return as JSON):
      1. Likely department (Sales, Marketing, Engineering, etc.)
      2. Seniority level (Junior, Mid, Senior, Executive)
      3. Key responsibilities
      4. Likely skills based on role
      
      Be conservative and only return high-confidence inferences.
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing professional profiles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const aiData = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    return {
      department: aiData.department,
      seniority: aiData.seniority,
      role: aiData.responsibilities,
      skills: aiData.skills || []
    };
  } catch (error) {
    console.error('AI contact enrichment failed:', error);
    return {};
  }
}

/**
 * Mock API enrichment (would use real APIs like Clearbit, FullContact, etc.)
 */
async function mockApiEnrichment(domain: string): Promise<Partial<CompanyEnrichmentData>> {
  // Simulate API enrichment with mock data
  const mockData: Record<string, Partial<CompanyEnrichmentData>> = {
    'google.com': {
      employeeCount: 150000,
      annualRevenue: 280000000000,
      industry: 'Technology',
      subIndustry: 'Internet Software & Services',
      yearFounded: 1998,
      type: 'Public',
      ticker: 'GOOGL',
      headquarters: {
        city: 'Mountain View',
        state: 'CA',
        country: 'USA'
      }
    },
    'stripe.com': {
      employeeCount: 7000,
      annualRevenue: 14000000000,
      industry: 'Financial Services',
      subIndustry: 'Payment Processing',
      yearFounded: 2010,
      type: 'Private',
      fundingTotal: 2200000000,
      headquarters: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA'
      }
    }
  };
  
  // Return mock data if available, otherwise generate based on domain
  if (mockData[domain]) {
    return mockData[domain];
  }
  
  // Generate realistic mock data for unknown domains
  return {
    employeeRange: '11-50',
    industry: 'Technology',
    type: 'Private',
    socialProfiles: {
      linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
      twitter: `https://twitter.com/${domain.split('.')[0]}`
    }
  };
}

async function mockContactApiEnrichment(email: string): Promise<Partial<ContactEnrichmentData>> {
  const domain = email.split('@')[1];
  const username = email.split('@')[0];
  
  return {
    emailVerified: true,
    socialProfiles: {
      linkedin: `https://linkedin.com/in/${username}`,
    },
    location: {
      country: 'USA'
    }
  };
}

/**
 * Batch enrich all companies missing data
 */
export async function batchEnrichCompanies(
  workspaceId: string,
  limit: number = 10
): Promise<{ enriched: number; failed: number }> {
  // Find companies that haven't been enriched or are old
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Re-enrich after 30 days
  
  const companies = await entityService.find({
    workspaceId,
    type: 'company',
    where: {
      $or: [
        { 'data.enrichedAt': null },
        { 'data.enrichedAt': { $lt: cutoffDate } }
      ]
    },
    limit
  });
  
  let enriched = 0;
  let failed = 0;
  
  for (const company of companies) {
    try {
      await enrichCompany(workspaceId, company.id, company.data.domain);
      enriched++;
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to enrich company ${company.id}:`, error);
      failed++;
    }
  }
  
  return { enriched, failed };
}

/**
 * Auto-enrich on entity creation
 */
export async function autoEnrichOnCreate(
  workspaceId: string,
  entity: any
): Promise<void> {
  // Enrich companies and contacts automatically when created
  if (entity.type === 'company' && entity.data.domain) {
    // Enrich in background (don't block creation)
    setTimeout(async () => {
      try {
        await enrichCompany(workspaceId, entity.id, entity.data.domain);
      } catch (error) {
        console.error('Auto-enrichment failed:', error);
      }
    }, 2000);
  } else if (entity.type === 'contact' && entity.data.email) {
    setTimeout(async () => {
      try {
        await enrichContact(workspaceId, entity.id, entity.data.email);
      } catch (error) {
        console.error('Auto-enrichment failed:', error);
      }
    }, 2000);
  }
}

// Helper functions
function extractSignature(text: string): string | null {
  // Look for common signature patterns
  const signatureMarkers = ['--', 'Best regards', 'Sincerely', 'Thanks', 'Regards'];
  for (const marker of signatureMarkers) {
    const index = text.lastIndexOf(marker);
    if (index > text.length * 0.5) { // Signature usually in last half
      return text.slice(index);
    }
  }
  return null;
}

function extractAddress(signature: string): any {
  // Extract address patterns
  const addressRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)[\w\s,]+/i;
  const match = signature.match(addressRegex);
  if (match) {
    return { address: match[0] };
  }
  return null;
}

function extractPhone(text: string): string | null {
  const phoneRegex = /[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

function extractTitle(signature: string): string | null {
  // Common title patterns
  const lines = signature.split('\n');
  for (const line of lines) {
    if (line.includes('|') || line.includes('•')) {
      return line.split(/[|•]/)[0].trim();
    }
  }
  return null;
}

function inferCompanySize(titles: string[]): string {
  const executiveTitles = ['CEO', 'CTO', 'CFO', 'COO', 'President', 'VP'];
  const executiveCount = titles.filter(t => 
    executiveTitles.some(exec => t.includes(exec))
  ).length;
  
  if (executiveCount > 5) return '201-500';
  if (executiveCount > 2) return '51-200';
  if (executiveCount > 0) return '11-50';
  return '1-10';
}

function extractTechnologies(text: string): string[] {
  const techKeywords = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'AWS', 'Azure',
    'Google Cloud', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis',
    'Salesforce', 'HubSpot', 'Slack', 'Microsoft 365', 'Google Workspace'
  ];
  
  const found = new Set<string>();
  for (const tech of techKeywords) {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      found.add(tech);
    }
  }
  
  return Array.from(found);
}

function inferSeniority(emails: any[]): string {
  // Analyze email patterns
  const subjects = emails.map(e => e.data.subject || '').join(' ');
  
  if (subjects.includes('strategy') || subjects.includes('board')) return 'Executive';
  if (subjects.includes('team') || subjects.includes('manage')) return 'Senior';
  if (subjects.includes('report') || subjects.includes('update')) return 'Mid';
  return 'Junior';
}

function inferTimezone(emails: any[]): string {
  // Analyze send times to infer timezone
  const sendHours = emails.map(e => new Date(e.createdAt).getHours());
  const avgHour = sendHours.reduce((a, b) => a + b, 0) / sendHours.length;
  
  // Rough timezone inference
  if (avgHour >= 6 && avgHour <= 14) return 'America/New_York';
  if (avgHour >= 3 && avgHour <= 11) return 'America/Los_Angeles';
  if (avgHour >= 14 && avgHour <= 22) return 'Europe/London';
  return 'Unknown';
}

function inferRole(meetings: any[]): string {
  const titles = meetings.map(m => m.data.title || '').join(' ').toLowerCase();
  
  if (titles.includes('sales') || titles.includes('deal')) return 'Sales';
  if (titles.includes('product') || titles.includes('feature')) return 'Product';
  if (titles.includes('engineering') || titles.includes('technical')) return 'Engineering';
  if (titles.includes('marketing') || titles.includes('campaign')) return 'Marketing';
  return 'Business';
}

function getMostCommon<T>(items: T[]): T | undefined {
  const counts = new Map<string, { item: T; count: number }>();
  
  for (const item of items) {
    const key = JSON.stringify(item);
    const current = counts.get(key) || { item, count: 0 };
    current.count++;
    counts.set(key, current);
  }
  
  let maxCount = 0;
  let mostCommon: T | undefined;
  
  for (const { item, count } of counts.values()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  }
  
  return mostCommon;
}

function calculateDataQuality(data: any): number {
  // Calculate how complete the profile is
  const fields = Object.keys(data);
  const filledFields = fields.filter(f => 
    data[f] !== null && 
    data[f] !== undefined && 
    data[f] !== ''
  ).length;
  
  return Math.round((filledFields / fields.length) * 100);
}