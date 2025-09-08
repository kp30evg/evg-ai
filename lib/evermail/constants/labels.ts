/**
 * Auto-label definitions for EverMail
 * Smart categories that automatically classify emails
 */

export interface AutoLabel {
  id: string;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: string;
  priority: number; // Higher priority labels show first
}

export const AUTO_LABELS: Record<string, AutoLabel> = {
  // Primary Categories - Content-based
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Marketing and promotional messages',
    color: '#EA580C', // orange-600
    bgColor: '#FED7AA', // orange-200
    borderColor: '#FB923C', // orange-400
    icon: 'tag',
    priority: 40
  },
  news: {
    id: 'news',
    name: 'News',
    description: 'News and newsletter messages',
    color: '#CA8A04', // yellow-600
    bgColor: '#FEF3C7', // yellow-200
    borderColor: '#FCD34D', // yellow-400
    icon: 'newspaper',
    priority: 30
  },
  pitch: {
    id: 'pitch',
    name: 'Pitch',
    description: 'Cold pitch and outreach messages',
    color: '#9333EA', // purple-600
    bgColor: '#E9D5FF', // purple-200
    borderColor: '#C084FC', // purple-400
    icon: 'briefcase',
    priority: 50
  },
  social: {
    id: 'social',
    name: 'Social',
    description: 'Social network and online community messages',
    color: '#2563EB', // blue-600
    bgColor: '#DBEAFE', // blue-200
    borderColor: '#60A5FA', // blue-400
    icon: 'users',
    priority: 20
  },
  
  // Action Categories - Require user action
  respond: {
    id: 'respond',
    name: 'Respond',
    description: 'Messages that need your response',
    color: '#16A34A', // green-600
    bgColor: '#BBF7D0', // green-200
    borderColor: '#4ADE80', // green-400
    icon: 'reply',
    priority: 100 // Highest priority
  },
  meeting: {
    id: 'meeting',
    name: 'Meeting',
    description: 'Messages about scheduling meetings',
    color: '#0891B2', // teal-600
    bgColor: '#A5F3FC', // teal-200
    borderColor: '#22D3EE', // teal-400
    icon: 'calendar',
    priority: 90
  },
  signature: {
    id: 'signature',
    name: 'Signature',
    description: 'Documents you need to sign',
    color: '#DB2777', // pink-600
    bgColor: '#FBCFE8', // pink-200
    borderColor: '#F472B6', // pink-400
    icon: 'edit',
    priority: 95
  },
  login: {
    id: 'login',
    name: 'Login',
    description: 'Password resets and one-time passcodes',
    color: '#4F46E5', // indigo-600
    bgColor: '#E0E7FF', // indigo-200
    borderColor: '#818CF8', // indigo-400
    icon: 'lock',
    priority: 10
  }
};

// Pattern rules for fast classification
export interface PatternRule {
  field: 'from' | 'subject' | 'body' | 'to';
  patterns: string[];
  weight: number;
  matchType?: 'contains' | 'exact' | 'regex';
}

export interface LabelPatterns {
  [key: string]: {
    rules: PatternRule[];
    minConfidence: number;
    specialChecks?: string[]; // Special functions to run
  };
}

export const LABEL_PATTERNS: LabelPatterns = {
  marketing: {
    minConfidence: 0.6,
    rules: [
      {
        field: 'from',
        patterns: ['newsletter', 'promo', 'deals', 'offer', 'sale', 'marketing', 'campaign'],
        weight: 0.8,
        matchType: 'contains'
      },
      {
        field: 'subject',
        patterns: ['% off', 'sale', 'limited time', 'exclusive', 'deal', 'save', 'discount', 'offer ends'],
        weight: 0.7,
        matchType: 'contains'
      },
      {
        field: 'body',
        patterns: ['unsubscribe', 'opt-out', 'email preferences', 'marketing email'],
        weight: 0.9,
        matchType: 'contains'
      }
    ],
    specialChecks: ['hasUnsubscribeLink']
  },
  
  news: {
    minConfidence: 0.6,
    rules: [
      {
        field: 'from',
        patterns: ['nytimes', 'techcrunch', 'medium', 'substack', 'forbes', 'reuters', 'bloomberg'],
        weight: 0.9,
        matchType: 'contains'
      },
      {
        field: 'subject',
        patterns: ['daily brief', 'weekly digest', 'news update', 'morning brew', 'headlines'],
        weight: 0.8,
        matchType: 'contains'
      }
    ]
  },
  
  pitch: {
    minConfidence: 0.7,
    rules: [
      {
        field: 'subject',
        patterns: ['opportunity', 'partnership', 'proposal', 'introduction', 'reaching out'],
        weight: 0.7,
        matchType: 'contains'
      },
      {
        field: 'body',
        patterns: ['reach out', 'touching base', 'quick call', 'partnership opportunity', 'explore synergies'],
        weight: 0.8,
        matchType: 'contains'
      }
    ],
    specialChecks: ['isFirstTimeContact', 'hasCalendarLink']
  },
  
  social: {
    minConfidence: 0.5,
    rules: [
      {
        field: 'from',
        patterns: ['linkedin.com', 'twitter.com', 'facebook.com', 'instagram.com', 'github.com'],
        weight: 0.95,
        matchType: 'contains'
      },
      {
        field: 'subject',
        patterns: ['mentioned you', 'new follower', 'comment', 'liked', 'shared', 'tagged'],
        weight: 0.9,
        matchType: 'contains'
      }
    ]
  },
  
  respond: {
    minConfidence: 0.7,
    rules: [
      {
        field: 'body',
        patterns: ['could you', 'would you', 'can you', 'please', 'let me know', 'thoughts?', 'what do you think'],
        weight: 0.8,
        matchType: 'contains'
      }
    ],
    specialChecks: ['hasQuestions', 'isPartOfThread', 'awaitingResponse']
  },
  
  meeting: {
    minConfidence: 0.7,
    rules: [
      {
        field: 'subject',
        patterns: ['meeting', 'call', 'schedule', 'calendar', 'invite', 'appointment'],
        weight: 0.9,
        matchType: 'contains'
      },
      {
        field: 'body',
        patterns: ['calendar', 'schedule', 'meeting', 'call', 'zoom', 'teams', 'google meet', 'availability'],
        weight: 0.8,
        matchType: 'contains'
      }
    ],
    specialChecks: ['hasCalendarInvite', 'hasSchedulingLink']
  },
  
  signature: {
    minConfidence: 0.8,
    rules: [
      {
        field: 'from',
        patterns: ['docusign', 'hellosign', 'pandadoc', 'adobe sign', 'dropbox sign'],
        weight: 0.95,
        matchType: 'contains'
      },
      {
        field: 'subject',
        patterns: ['signature required', 'please sign', 'document to sign', 'action required'],
        weight: 0.9,
        matchType: 'contains'
      }
    ]
  },
  
  login: {
    minConfidence: 0.8,
    rules: [
      {
        field: 'subject',
        patterns: ['verification code', 'reset password', 'confirm your', 'verify your', 'security code', 'one-time'],
        weight: 0.9,
        matchType: 'contains'
      },
      {
        field: 'from',
        patterns: ['no-reply', 'noreply', 'do-not-reply', 'donotreply'],
        weight: 0.7,
        matchType: 'contains'
      }
    ],
    specialChecks: ['hasVerificationCode', 'isSystemGenerated']
  }
};

// Get labels sorted by priority
export function getSortedLabels(): AutoLabel[] {
  return Object.values(AUTO_LABELS).sort((a, b) => b.priority - a.priority);
}

// Get label by ID
export function getLabel(labelId: string): AutoLabel | undefined {
  return AUTO_LABELS[labelId];
}

// Check if a label requires immediate action
export function isActionLabel(labelId: string): boolean {
  return ['respond', 'meeting', 'signature'].includes(labelId);
}