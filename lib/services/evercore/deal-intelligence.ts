/**
 * Deal Intelligence Engine - Autonomous deal scoring and risk detection
 * This is the brain of EverCore that makes it smarter than Salesforce/HubSpot
 */

import { entityService } from '@/lib/entities/entity-service';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DealSignals {
  emailEngagement: {
    frequency: number;
    sentiment: number;
    responseTime: number;
    threadDepth: number;
  };
  meetingActivity: {
    count: number;
    frequency: number;
    attendance: number;
    duration: number;
  };
  stakeholderEngagement: {
    totalContacts: number;
    seniorityLevel: number;
    decisionMakerInvolved: boolean;
    championIdentified: boolean;
  };
  dealVelocity: {
    daysInStage: number;
    stageProgressionSpeed: number;
    expectedCloseAdherence: number;
  };
  contentEngagement: {
    proposalViews: number;
    documentDownloads: number;
    linkClicks: number;
  };
  competitiveSignals: {
    competitorMentions: number;
    priceObjections: number;
    featureGaps: number;
  };
}

export interface DealScore {
  overallScore: number; // 0-100
  probability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  factors: {
    positive: string[];
    negative: string[];
    recommendations: string[];
  };
  predictedCloseDate?: Date;
  predictedValue?: number;
}

/**
 * Calculate comprehensive deal score using AI and data signals
 */
export async function calculateDealScore(
  workspaceId: string,
  dealId: string
): Promise<DealScore> {
  // Get deal and all related entities
  const deal = await entityService.findById(workspaceId, dealId);
  if (!deal || deal.type !== 'deal') {
    throw new Error('Deal not found');
  }

  // Get all related activities
  const related = await entityService.findRelated(workspaceId, dealId);
  
  // Gather signals
  const signals = await gatherDealSignals(workspaceId, deal, related);
  
  // Calculate base score from signals
  const baseScore = calculateBaseScore(signals);
  
  // Get AI insights from conversation analysis
  const aiInsights = await analyzeConversations(related);
  
  // Combine for final score
  const finalScore = combineScores(baseScore, aiInsights, deal);
  
  // Update deal with new score
  await entityService.update(workspaceId, dealId, {
    ...deal.data,
    dealScore: finalScore.overallScore,
    riskLevel: finalScore.riskLevel,
    scoreLastUpdated: new Date(),
    predictedCloseDate: finalScore.predictedCloseDate,
    scoreFactors: finalScore.factors,
  });
  
  return finalScore;
}

/**
 * Gather all signals from deal-related activities
 */
async function gatherDealSignals(
  workspaceId: string,
  deal: any,
  related: any[]
): Promise<DealSignals> {
  const now = Date.now();
  const dayInMs = 1000 * 60 * 60 * 24;
  
  // Filter related entities by type
  const emails = related.filter(e => e.type === 'email');
  const meetings = related.filter(e => e.type === 'calendar_event' || e.type === 'meeting');
  const messages = related.filter(e => e.type === 'message');
  const tasks = related.filter(e => e.type === 'task');
  
  // Email engagement analysis
  const recentEmails = emails.filter(e => 
    (now - new Date(e.createdAt).getTime()) < 30 * dayInMs
  );
  
  const emailSentiments = recentEmails
    .map(e => e.data.sentiment || 50)
    .filter(s => s > 0);
  
  const avgEmailSentiment = emailSentiments.length > 0
    ? emailSentiments.reduce((a, b) => a + b, 0) / emailSentiments.length
    : 50;
  
  // Meeting activity
  const recentMeetings = meetings.filter(m =>
    (now - new Date(m.createdAt).getTime()) < 30 * dayInMs
  );
  
  // Stakeholder analysis
  const uniqueContacts = new Set();
  [...emails, ...meetings, ...messages].forEach(item => {
    if (item.data.from) uniqueContacts.add(item.data.from);
    if (item.data.to) {
      if (Array.isArray(item.data.to)) {
        item.data.to.forEach((t: any) => uniqueContacts.add(t));
      } else {
        uniqueContacts.add(item.data.to);
      }
    }
  });
  
  // Deal velocity
  const dealCreatedAt = new Date(deal.createdAt).getTime();
  const daysInPipeline = Math.floor((now - dealCreatedAt) / dayInMs);
  const stageChanges = related.filter(e => e.type === 'stage_change');
  
  return {
    emailEngagement: {
      frequency: recentEmails.length,
      sentiment: avgEmailSentiment,
      responseTime: calculateAvgResponseTime(emails),
      threadDepth: calculateAvgThreadDepth(emails),
    },
    meetingActivity: {
      count: recentMeetings.length,
      frequency: recentMeetings.length / Math.max(1, daysInPipeline / 30),
      attendance: calculateAvgAttendance(meetings),
      duration: calculateAvgDuration(meetings),
    },
    stakeholderEngagement: {
      totalContacts: uniqueContacts.size,
      seniorityLevel: calculateSeniorityLevel(uniqueContacts),
      decisionMakerInvolved: checkDecisionMaker(uniqueContacts),
      championIdentified: checkChampion(emails, meetings),
    },
    dealVelocity: {
      daysInStage: calculateDaysInCurrentStage(deal, stageChanges),
      stageProgressionSpeed: calculateProgressionSpeed(stageChanges, daysInPipeline),
      expectedCloseAdherence: calculateCloseAdherence(deal),
    },
    contentEngagement: {
      proposalViews: countProposalViews(related),
      documentDownloads: countDocumentDownloads(related),
      linkClicks: countLinkClicks(related),
    },
    competitiveSignals: {
      competitorMentions: countCompetitorMentions(emails, messages),
      priceObjections: countPriceObjections(emails, messages),
      featureGaps: countFeatureGaps(emails, messages),
    },
  };
}

/**
 * Calculate base score from signals
 */
function calculateBaseScore(signals: DealSignals): number {
  let score = 50; // Start neutral
  
  // Email engagement (max 15 points)
  score += Math.min(15, signals.emailEngagement.frequency * 1.5);
  score += (signals.emailEngagement.sentiment - 50) / 10; // -5 to +5 points
  
  // Meeting activity (max 20 points)
  score += Math.min(20, signals.meetingActivity.count * 5);
  
  // Stakeholder engagement (max 15 points)
  if (signals.stakeholderEngagement.totalContacts > 3) score += 5;
  if (signals.stakeholderEngagement.decisionMakerInvolved) score += 10;
  
  // Deal velocity (can add or subtract points)
  if (signals.dealVelocity.daysInStage > 30) score -= 5;
  if (signals.dealVelocity.stageProgressionSpeed > 1) score += 5;
  
  // Content engagement (max 10 points)
  score += Math.min(10, 
    signals.contentEngagement.proposalViews * 2 +
    signals.contentEngagement.documentDownloads * 3
  );
  
  // Competitive signals (can subtract points)
  score -= signals.competitiveSignals.competitorMentions * 2;
  score -= signals.competitiveSignals.priceObjections * 3;
  
  // Keep within bounds
  return Math.max(0, Math.min(100, score));
}

/**
 * Use AI to analyze conversation sentiment and buying signals
 */
async function analyzeConversations(related: any[]): Promise<any> {
  const conversations = related
    .filter(e => e.type === 'email' || e.type === 'message')
    .slice(0, 10); // Analyze last 10 conversations
  
  if (conversations.length === 0) {
    return { sentiment: 50, buyingSignals: [], concerns: [] };
  }
  
  const conversationText = conversations
    .map(c => c.data.content || c.data.body || '')
    .join('\n---\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a sales intelligence analyst. Analyze these conversations and identify:
          1. Overall sentiment (0-100, where 100 is very positive)
          2. Buying signals (list of positive indicators)
          3. Concerns or objections (list of negative indicators)
          4. Urgency level (low/medium/high)
          5. Decision timeline if mentioned
          
          Return as JSON: {sentiment, buyingSignals, concerns, urgency, timeline}`
        },
        {
          role: 'user',
          content: conversationText.slice(0, 4000) // Limit context
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('AI analysis failed:', error);
    return { sentiment: 50, buyingSignals: [], concerns: [] };
  }
}

/**
 * Combine all scores and insights
 */
function combineScores(
  baseScore: number,
  aiInsights: any,
  deal: any
): DealScore {
  // Weight the scores
  const finalScore = Math.round(
    baseScore * 0.6 + 
    (aiInsights.sentiment || 50) * 0.4
  );
  
  // Determine risk level
  let riskLevel: DealScore['riskLevel'] = 'low';
  if (finalScore < 30) riskLevel = 'critical';
  else if (finalScore < 50) riskLevel = 'high';
  else if (finalScore < 70) riskLevel = 'medium';
  
  // Calculate probability (different from score)
  const stageProbabilities: Record<string, number> = {
    'prospecting': 10,
    'qualification': 20,
    'proposal': 40,
    'negotiation': 60,
    'closing': 80,
  };
  
  const baseProbability = stageProbabilities[deal.data.stage] || 50;
  const adjustedProbability = Math.round(
    baseProbability * 0.5 + finalScore * 0.5
  );
  
  // Build factors
  const factors: DealScore['factors'] = {
    positive: aiInsights.buyingSignals || [],
    negative: aiInsights.concerns || [],
    recommendations: [],
  };
  
  // Add recommendations based on score
  if (finalScore < 50) {
    factors.recommendations.push('Schedule urgent meeting with decision maker');
    factors.recommendations.push('Address pricing concerns directly');
  } else if (finalScore < 70) {
    factors.recommendations.push('Increase engagement frequency');
    factors.recommendations.push('Involve more stakeholders');
  } else {
    factors.recommendations.push('Push for close');
    factors.recommendations.push('Prepare contract for signature');
  }
  
  // Predict close date
  const predictedCloseDate = aiInsights.timeline 
    ? new Date(aiInsights.timeline)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  return {
    overallScore: finalScore,
    probability: adjustedProbability,
    riskLevel,
    confidence: Math.min(100, (aiInsights.conversations?.length || 0) * 10),
    factors,
    predictedCloseDate,
    predictedValue: deal.data.value,
  };
}

/**
 * Detect deals at risk and alert
 */
export async function detectDealsAtRisk(
  workspaceId: string
): Promise<any[]> {
  // Get all open deals
  const deals = await entityService.find({
    workspaceId,
    type: 'deal',
    where: {
      stage: { $nin: ['closed_won', 'closed_lost'] }
    },
    limit: 100,
  });
  
  const riskyDeals = [];
  
  for (const deal of deals) {
    const score = await calculateDealScore(workspaceId, deal.id);
    
    if (score.riskLevel === 'high' || score.riskLevel === 'critical') {
      riskyDeals.push({
        deal,
        score,
        alerts: generateAlerts(deal, score),
      });
    }
  }
  
  return riskyDeals;
}

/**
 * Generate specific alerts for at-risk deals
 */
function generateAlerts(deal: any, score: DealScore): string[] {
  const alerts = [];
  
  if (score.overallScore < 30) {
    alerts.push(`🚨 Critical: ${deal.data.name} has ${score.overallScore}% health score`);
  }
  
  if (score.factors.negative.length > 3) {
    alerts.push(`⚠️ Multiple concerns detected in ${deal.data.name}`);
  }
  
  const closeDate = new Date(deal.data.closeDate);
  const daysToClose = Math.floor((closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysToClose < 7 && score.probability < 60) {
    alerts.push(`📅 ${deal.data.name} closing in ${daysToClose} days but only ${score.probability}% likely`);
  }
  
  return alerts;
}

// Helper functions
function calculateAvgResponseTime(emails: any[]): number {
  // Simplified: return average hours between emails
  return 24; // Default 24 hours
}

function calculateAvgThreadDepth(emails: any[]): number {
  // Count average replies in threads
  return 3; // Default 3 messages per thread
}

function calculateAvgAttendance(meetings: any[]): number {
  // Average number of attendees
  return 4; // Default 4 attendees
}

function calculateAvgDuration(meetings: any[]): number {
  // Average meeting duration in minutes
  return 30; // Default 30 minutes
}

function calculateSeniorityLevel(contacts: Set<any>): number {
  // Score based on titles (simplified)
  return 5; // Mid-level default
}

function checkDecisionMaker(contacts: Set<any>): boolean {
  // Check if C-level or VP involved
  return contacts.size > 2; // Simplified
}

function checkChampion(emails: any[], meetings: any[]): boolean {
  // Identify if we have an internal champion
  return emails.length > 5; // Simplified
}

function calculateDaysInCurrentStage(deal: any, stageChanges: any[]): number {
  const lastChange = stageChanges[stageChanges.length - 1];
  if (!lastChange) {
    return Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - new Date(lastChange.createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function calculateProgressionSpeed(stageChanges: any[], daysInPipeline: number): number {
  if (daysInPipeline === 0) return 0;
  return stageChanges.length / daysInPipeline;
}

function calculateCloseAdherence(deal: any): number {
  if (!deal.data.closeDate) return 50;
  const expectedClose = new Date(deal.data.closeDate).getTime();
  const now = Date.now();
  const variance = Math.abs(expectedClose - now) / (1000 * 60 * 60 * 24);
  return Math.max(0, 100 - variance);
}

function countProposalViews(related: any[]): number {
  return related.filter(e => e.type === 'proposal_view').length;
}

function countDocumentDownloads(related: any[]): number {
  return related.filter(e => e.type === 'document_download').length;
}

function countLinkClicks(related: any[]): number {
  return related.filter(e => e.type === 'link_click').length;
}

function countCompetitorMentions(emails: any[], messages: any[]): number {
  const competitors = ['salesforce', 'hubspot', 'pipedrive', 'monday'];
  let count = 0;
  [...emails, ...messages].forEach(item => {
    const content = (item.data.content || item.data.body || '').toLowerCase();
    competitors.forEach(comp => {
      if (content.includes(comp)) count++;
    });
  });
  return count;
}

function countPriceObjections(emails: any[], messages: any[]): number {
  const priceKeywords = ['expensive', 'costly', 'budget', 'price', 'cost', 'afford'];
  let count = 0;
  [...emails, ...messages].forEach(item => {
    const content = (item.data.content || item.data.body || '').toLowerCase();
    priceKeywords.forEach(keyword => {
      if (content.includes(keyword)) count++;
    });
  });
  return count;
}

function countFeatureGaps(emails: any[], messages: any[]): number {
  const gapKeywords = ['missing', 'lacks', "doesn't have", 'need', 'require', 'must have'];
  let count = 0;
  [...emails, ...messages].forEach(item => {
    const content = (item.data.content || item.data.body || '').toLowerCase();
    gapKeywords.forEach(keyword => {
      if (content.includes(keyword)) count++;
    });
  });
  return count;
}

/**
 * Predict revenue for a time period
 */
export async function predictRevenue(
  workspaceId: string,
  periodDays: number = 90
): Promise<{
  conservative: number;
  likely: number;
  optimistic: number;
  byStage: Record<string, number>;
}> {
  const deals = await entityService.find({
    workspaceId,
    type: 'deal',
    where: {
      stage: { $nin: ['closed_won', 'closed_lost'] }
    },
    limit: 1000,
  });
  
  let conservative = 0;
  let likely = 0;
  let optimistic = 0;
  const byStage: Record<string, number> = {};
  
  for (const deal of deals) {
    const closeDate = new Date(deal.data.closeDate || Date.now() + 90 * 24 * 60 * 60 * 1000);
    const daysToClose = Math.floor((closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysToClose <= periodDays) {
      const value = deal.data.value || 0;
      const probability = deal.data.probability || 50;
      
      // Conservative: only high probability deals
      if (probability >= 70) {
        conservative += value * 0.8;
      }
      
      // Likely: weighted by probability
      likely += value * (probability / 100);
      
      // Optimistic: all deals at full value if >30% probability
      if (probability >= 30) {
        optimistic += value;
      }
      
      // By stage
      const stage = deal.data.stage || 'unknown';
      byStage[stage] = (byStage[stage] || 0) + value * (probability / 100);
    }
  }
  
  return {
    conservative: Math.round(conservative),
    likely: Math.round(likely),
    optimistic: Math.round(optimistic),
    byStage,
  };
}