/**
 * Autonomous Engine for EverCore
 * This is the magic - automatically creates and maintains CRM records
 * without any manual data entry
 */

import { entityService } from '@/lib/entities/entity-service';
import * as evercore from '@/lib/modules-simple/evercore';

/**
 * Process new email entities to auto-create contacts and companies
 */
export async function processEmailForCRM(
  workspaceId: string,
  emailEntity: any
): Promise<void> {
  try {
    // Auto-create contact and company from email
    const result = await evercore.autoCreateFromEmail(workspaceId, emailEntity);
    
    if (result.contact) {
      console.log(`✨ Auto-created contact: ${result.contact.data.firstName} ${result.contact.data.lastName}`);
      
      // Analyze email content for potential deals
      await detectDealIntent(workspaceId, emailEntity, result.contact);
    }
    
    if (result.company) {
      console.log(`🏢 Auto-created company: ${result.company.data.name}`);
      
      // Enrich company data asynchronously
      await enrichCompanyData(workspaceId, result.company.id);
    }
    
    // Update sentiment and engagement scores
    await updateSentimentScores(workspaceId, emailEntity);
    
  } catch (error) {
    console.error('Error processing email for CRM:', error);
  }
}

/**
 * Process calendar events to link with contacts and deals
 */
export async function processCalendarEventForCRM(
  workspaceId: string,
  eventEntity: any
): Promise<void> {
  try {
    const attendees = eventEntity.data.attendees || [];
    
    for (const attendee of attendees) {
      if (attendee.email) {
        // Check if contact exists
        const contacts = await entityService.find({
          workspaceId,
          type: 'contact',
          where: { email: attendee.email },
          limit: 1
        });
        
        if (contacts.length === 0) {
          // Create contact from calendar attendee
          const [firstName, ...lastNameParts] = (attendee.name || attendee.email.split('@')[0]).split(' ');
          const lastName = lastNameParts.join(' ');
          
          await evercore.createContact(workspaceId, {
            firstName,
            lastName: lastName || '',
            email: attendee.email,
            source: 'calendar'
          });
        } else {
          // Update last contacted date
          await entityService.update(workspaceId, contacts[0].id, {
            lastContactedAt: new Date(eventEntity.data.startTime)
          });
          
          // Link event to contact
          await entityService.link(workspaceId, eventEntity.id, contacts[0].id, 'meeting');
        }
      }
    }
  } catch (error) {
    console.error('Error processing calendar event for CRM:', error);
  }
}

/**
 * Detect potential deal intent from email content
 */
async function detectDealIntent(
  workspaceId: string,
  emailEntity: any,
  contact: any
): Promise<void> {
  const content = emailEntity.data.body?.text || emailEntity.data.body?.snippet || '';
  const subject = emailEntity.data.subject || '';
  
  // Simple keyword detection (in production, use AI)
  const dealKeywords = [
    'proposal', 'quote', 'pricing', 'contract', 'purchase',
    'interested in', 'looking for', 'budget', 'timeline',
    'demo', 'trial', 'evaluation', 'requirements'
  ];
  
  const combinedText = `${subject} ${content}`.toLowerCase();
  const hasDeaIntent = dealKeywords.some(keyword => combinedText.includes(keyword));
  
  if (hasDeaIntent) {
    // Check if deal already exists for this contact
    const existingDeals = await evercore.getDeals(workspaceId, {
      companyId: contact.relationships?.company
    });
    
    const recentDeal = existingDeals.find(d => 
      d.data.stage !== 'closed_won' && d.data.stage !== 'closed_lost'
    );
    
    if (!recentDeal) {
      // Suggest creating a new deal (in production, could auto-create)
      console.log(`💡 Deal intent detected for ${contact.data.firstName} - consider creating a deal`);
      
      // Store as metadata for later reference
      await entityService.update(workspaceId, emailEntity.id, undefined, undefined, {
        dealIntentDetected: true,
        detectedKeywords: dealKeywords.filter(kw => combinedText.includes(kw))
      });
    }
  }
}

/**
 * Enrich company data from domain
 */
async function enrichCompanyData(
  workspaceId: string,
  companyId: string
): Promise<void> {
  try {
    const company = await entityService.findById(workspaceId, companyId);
    if (!company || !company.data.domain) return;
    
    // In production, call external enrichment APIs
    // For now, use mock enrichment based on domain
    const domain = company.data.domain;
    const enrichedData: any = {};
    
    // Mock enrichment logic
    if (domain.includes('tech') || domain.includes('soft') || domain.includes('app')) {
      enrichedData.industry = 'Technology';
      enrichedData.employeeCount = 100;
    } else if (domain.includes('consult') || domain.includes('advisor')) {
      enrichedData.industry = 'Consulting';
      enrichedData.employeeCount = 50;
    } else if (domain.includes('law') || domain.includes('legal')) {
      enrichedData.industry = 'Legal';
      enrichedData.employeeCount = 25;
    } else {
      enrichedData.industry = 'Other';
      enrichedData.employeeCount = 10;
    }
    
    // Update company with enriched data
    await entityService.update(workspaceId, companyId, enrichedData, undefined, {
      enrichedAt: new Date(),
      enrichmentSource: 'auto'
    });
    
    console.log(`✨ Enriched company ${company.data.name} with industry: ${enrichedData.industry}`);
  } catch (error) {
    console.error('Error enriching company:', error);
  }
}

/**
 * Update sentiment scores based on email content
 */
async function updateSentimentScores(
  workspaceId: string,
  emailEntity: any
): Promise<void> {
  const fromEmail = emailEntity.data.from?.email || emailEntity.data.from;
  if (!fromEmail) return;
  
  // Find the contact
  const contacts = await entityService.find({
    workspaceId,
    type: 'contact',
    where: { email: fromEmail },
    limit: 1
  });
  
  if (contacts.length === 0) return;
  
  const content = emailEntity.data.body?.text || emailEntity.data.body?.snippet || '';
  
  // Simple sentiment analysis (in production, use AI)
  const positiveWords = ['thanks', 'great', 'excellent', 'happy', 'pleased', 'excited', 'wonderful', 'perfect'];
  const negativeWords = ['disappointed', 'frustrated', 'unhappy', 'problem', 'issue', 'concern', 'delay', 'cancel'];
  
  const lowerContent = content.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
  
  const currentScore = contacts[0].data.sentimentScore || 50;
  let newScore = currentScore;
  
  if (positiveCount > negativeCount) {
    newScore = Math.min(100, currentScore + (positiveCount * 5));
  } else if (negativeCount > positiveCount) {
    newScore = Math.max(0, currentScore - (negativeCount * 5));
  }
  
  if (newScore !== currentScore) {
    await entityService.update(workspaceId, contacts[0].id, {
      sentimentScore: newScore
    });
    
    console.log(`📊 Updated sentiment for ${contacts[0].data.firstName}: ${currentScore} → ${newScore}`);
  }
}

/**
 * Map organizational relationships from email patterns
 */
export async function mapOrganizationRelationships(
  workspaceId: string,
  companyDomain: string
): Promise<void> {
  try {
    // Find all contacts at this company
    const contacts = await entityService.find({
      workspaceId,
      type: 'contact',
      search: companyDomain,
      limit: 100
    });
    
    // Analyze email patterns to determine relationships
    const emailPatterns: Record<string, number> = {};
    
    for (const contact of contacts) {
      // Find all emails from this contact
      const emails = await entityService.find({
        workspaceId,
        type: 'email',
        where: { from: contact.data.email },
        limit: 50
      });
      
      // Count who they email most frequently
      for (const email of emails) {
        const recipients = email.data.to || [];
        for (const recipient of recipients) {
          if (recipient.includes(companyDomain)) {
            emailPatterns[recipient] = (emailPatterns[recipient] || 0) + 1;
          }
        }
      }
    }
    
    // Identify decision makers based on email patterns
    // Those who receive the most emails are likely decision makers
    const sortedByFrequency = Object.entries(emailPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    for (const [email, frequency] of sortedByFrequency) {
      const contact = contacts.find(c => c.data.email === email);
      if (contact && frequency > 5) {
        await entityService.update(workspaceId, contact.id, undefined, undefined, {
          role: 'decision_maker',
          communicationFrequency: frequency
        });
        
        console.log(`👤 Identified decision maker: ${contact.data.firstName} ${contact.data.lastName}`);
      }
    }
  } catch (error) {
    console.error('Error mapping organization relationships:', error);
  }
}

/**
 * Monitor for at-risk accounts based on engagement
 */
export async function monitorAccountHealth(workspaceId: string): Promise<void> {
  try {
    // Get all companies
    const companies = await evercore.getCompanies(workspaceId);
    
    for (const company of companies) {
      // Get all contacts at this company
      const contacts = await evercore.getContacts(workspaceId, {
        companyId: company.id
      });
      
      // Calculate average days since last contact
      const daysSinceContacts = contacts
        .map(c => {
          if (!c.data.lastContactedAt) return 999;
          return Math.floor((Date.now() - new Date(c.data.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter(d => d < 999);
      
      if (daysSinceContacts.length === 0) continue;
      
      const avgDaysSinceContact = daysSinceContacts.reduce((a, b) => a + b, 0) / daysSinceContacts.length;
      
      // Calculate new health score
      let healthScore = 50;
      
      if (avgDaysSinceContact < 7) {
        healthScore = 80;
      } else if (avgDaysSinceContact < 14) {
        healthScore = 70;
      } else if (avgDaysSinceContact < 30) {
        healthScore = 50;
      } else if (avgDaysSinceContact < 60) {
        healthScore = 30;
      } else {
        healthScore = 10;
      }
      
      // Check for active deals
      const deals = await evercore.getDeals(workspaceId, {
        companyId: company.id
      });
      
      const activeDeals = deals.filter(d => 
        !['closed_won', 'closed_lost'].includes(d.data.stage?.toLowerCase())
      );
      
      if (activeDeals.length > 0) {
        healthScore = Math.min(100, healthScore + 20);
      }
      
      // Update company health score
      if (company.data.healthScore !== healthScore) {
        await entityService.update(workspaceId, company.id, {
          healthScore
        });
        
        console.log(`🏥 Updated health score for ${company.data.name}: ${company.data.healthScore} → ${healthScore}`);
        
        // Alert if health score drops significantly
        if (healthScore < 30 && company.data.healthScore >= 30) {
          console.log(`⚠️ ALERT: ${company.data.name} is now at risk (health score: ${healthScore})`);
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring account health:', error);
  }
}

/**
 * Run all autonomous processes
 * This should be called periodically (e.g., every 5 minutes)
 */
export async function runAutonomousEngine(workspaceId: string): Promise<void> {
  console.log('🤖 Running EverCore Autonomous Engine...');
  
  try {
    // Process recent emails
    const recentEmails = await entityService.find({
      workspaceId,
      type: 'email',
      limit: 50,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    for (const email of recentEmails) {
      // Check if already processed
      if (!email.metadata?.processedByCRM) {
        await processEmailForCRM(workspaceId, email);
        
        // Mark as processed
        await entityService.update(workspaceId, email.id, undefined, undefined, {
          processedByCRM: true,
          processedAt: new Date()
        });
      }
    }
    
    // Process recent calendar events
    const recentEvents = await entityService.find({
      workspaceId,
      type: 'calendar_event',
      limit: 20,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    for (const event of recentEvents) {
      if (!event.metadata?.processedByCRM) {
        await processCalendarEventForCRM(workspaceId, event);
        
        // Mark as processed
        await entityService.update(workspaceId, event.id, undefined, undefined, {
          processedByCRM: true,
          processedAt: new Date()
        });
      }
    }
    
    // Monitor account health
    await monitorAccountHealth(workspaceId);
    
    console.log('✅ Autonomous Engine cycle complete');
  } catch (error) {
    console.error('Error in autonomous engine:', error);
  }
}