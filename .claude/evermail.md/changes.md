The dashboard's natural language processor needs to properly handle email-related commands and provide rich, actionable responses that integrate with EverMail's features.
Current Problem
When users ask "summarize my emails this week", the response is generic and doesn't provide useful functionality. It should leverage EverMail's actual data and capabilities.
Fix Requirements
1. Enhanced Email Command Recognition
Update /lib/modules-simple/command-processor.ts to recognize these email patterns:
Summary Commands:

"summarize my emails [timeframe]"
"what emails did I get [timeframe]"
"show me important emails"
"any urgent emails?"

Action Commands:

"draft a response to [person]"
"reply to [latest email from X]"
"send email to [person] about [topic]"
"follow up on [topic]"

Analytics Commands:

"who emails me the most?"
"email response time"
"unread email count"
"emails needing response"

2. Rich Response Format
Instead of plain text, return structured responses with:
typescriptinterface EmailCommandResponse {
  summary: {
    text: string;
    stats: {
      total: number;
      unread: number;
      needingResponse: number;
      fromVIPs: number;
    };
  };
  emails: {
    id: string;
    from: string;
    subject: string;
    preview: string;
    timestamp: string;
    labels?: string[];
    priority?: 'high' | 'normal' | 'low';
  }[];
  actions: {
    type: 'button' | 'link';
    label: string;
    action: string; // e.g., 'open_email', 'compose', 'mark_read'
    data?: any;
  }[];
  suggestions: string[];
}
3. Actual Data Integration
Pull REAL email data from the database:

Query actual emails from entities table
Filter by user and timeframe
Identify important emails (VIPs, keywords, urgency)
Calculate real statistics
Generate actionable summaries

4. Interactive Response Components
The dashboard should render email responses with:
Email List Component:

Clickable email previews
Quick actions (reply, archive, star)
Visual priority indicators
Label badges

Action Buttons:

"Open in EverMail" → Navigate to /mail/inbox
"Compose New" → Navigate to /mail/compose
"Mark All Read" → Execute bulk action
"Quick Reply" → Inline compose modal

5. Improved Response Examples
For "summarize my emails this week":
## 📧 Email Summary: This Week

You have **47 emails** (12 unread) from 23 people.

**Priority Emails:**
- **MagicPath** - Creating your custom design system (needs response)
- **Claude Code Workshop** - Enterprise B2B Sales workflows
- **Substack** - Productivity philosophy article

**Key Stats:**
- 3 emails need responses
- 2 from VIP contacts
- 5 newsletters (auto-labeled)

[Open EverMail] [Compose New] [Mark All Read]

💡 Try asking: "Draft a response to MagicPath about the design system"
6. Command Examples to Implement
typescript// Email summary with real data
if (command.includes('email') && command.includes('summar')) {
  const emails = await getRecentEmails(workspaceId, userId, timeframe);
  return {
    type: 'email_summary',
    emails: emails.slice(0, 5),
    stats: calculateEmailStats(emails),
    actions: [
      { label: 'Open EverMail', action: 'navigate', url: '/mail/inbox' },
      { label: 'Compose', action: 'navigate', url: '/mail/compose' }
    ]
  };
}

// Draft email command
if (command.includes('draft') || command.includes('send email')) {
  const recipient = extractRecipient(command);
  const topic = extractTopic(command);
  const draft = await generateEmailDraft(recipient, topic);
  return {
    type: 'email_draft',
    draft: draft,
    actions: [
      { label: 'Send Now', action: 'send_email' },
      { label: 'Edit in EverMail', action: 'navigate', url: '/mail/compose' }
    ]
  };
}