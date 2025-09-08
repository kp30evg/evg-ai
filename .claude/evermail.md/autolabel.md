Build an intelligent auto-labeling system for EverMail that automatically categorizes emails using AI, similar to Superhuman's approach but integrated with evergreenOS's unified architecture.
Feature Overview
Automatically analyze and categorize all emails (existing and incoming) into smart labels that appear below the manual labels section. Each email shows its category with a color-coded badge, and clicking any category shows all emails within it.
Core Requirements
1. Auto-Label Categories
Implement these 8 smart categories:
Primary Categories:

marketing (orange) - Marketing and promotional messages
news (yellow) - News and newsletter messages
pitch (purple) - Cold pitch and outreach messages
social (blue) - Social network and online community messages

Action Categories:

respond (green) - Messages that need your response
meeting (teal) - Messages about scheduling meetings
signature (pink) - Documents you need to sign
login (indigo) - Password resets and one-time passcodes

2. AI Classification System
Location: /lib/evermail/services/auto-label-service.ts
Create a service that:

Analyzes email content, sender, subject, and metadata
Uses GPT-4 to classify emails into categories
Assigns confidence scores to each label
Can assign multiple labels if appropriate
Processes in background without blocking UI

Classification Logic:
For each email:
1. Extract features (sender domain, subject keywords, body content)
2. Check against pattern rules first (fast path)
3. If uncertain, use AI classification (slow path)
4. Store label assignments with confidence scores
5. Update UI in real-time
3. Database Updates
Extend email entity to include:

autoLabels: Array of assigned category labels
labelConfidence: Object mapping labels to confidence scores
labelledAt: Timestamp of when labels were assigned
labelVersion: Track which AI model/rules were used

Store as part of the email entity's metadata in the existing entities table.
4. UI Implementation
Sidebar Updates (/components/evermail/Sidebar.tsx):
Current Structure:
- Inbox
- Starred  
- Snoozed
- Sent
- Drafts
- [Manual Labels Section]

Add After Labels:
- [Auto Labels Section]
  - Marketing (312)
  - News (156)
  - Pitch (47)
  - Social (89)
  - Respond (23)
  - Meeting (8)
  - Signature (2)
  - Login (14)
Email List View (/components/evermail/EmailList.tsx):

Add colored label badge next to each email subject
Use same colors as Superhuman reference
Show multiple labels if email fits multiple categories
Make labels clickable to filter by that category

Label Badge Component:
Create reusable component that:
- Shows label name with appropriate color
- Has hover state
- Can be clicked to filter
- Shows in both list view and email detail view
5. Pattern-Based Fast Classification
Quick Rules (before AI):
marketing:
- From: contains "newsletter", "promo", "deals", "offer"
- Subject: contains "% off", "sale", "limited time"
- Unsubscribe link present

news:
- From: known news domains (nytimes, techcrunch, etc.)
- Subject: contains "daily brief", "weekly digest"

pitch:
- First-time sender + lengthy email
- Contains "reach out", "opportunity", "partnership"
- Has calendar scheduling links

social:
- From: linkedin.com, twitter.com, facebook.com
- Subject: "mentioned you", "new follower", "comment"

respond:
- Questions marks in body
- "Please", "Could you", "Would you"
- Previous thread exists without response

meeting:
- Contains "calendar", "schedule", "meeting", "call"
- Has time references
- Calendar invite attached

signature:
- From: docusign, hellosign, pandadoc
- Contains "sign", "signature required"

login:
- Subject: "verification code", "reset password"
- Body contains 6-digit code
- From: no-reply addresses
6. AI Classification Prompt
When pattern matching isn't conclusive:
Analyze this email and categorize it into one or more of these labels:
- marketing: promotional/sales messages
- news: newsletters/news updates
- pitch: cold outreach/sales pitches
- social: social media notifications
- respond: requires a response from recipient
- meeting: about scheduling meetings
- signature: documents needing signature
- login: authentication/password resets

Email:
From: [sender]
Subject: [subject]
Body: [first 500 characters]

Return JSON with labels and confidence (0-1):
{
  "labels": ["respond", "meeting"],
  "confidence": {"respond": 0.9, "meeting": 0.8}
}
7. Background Processing
For existing emails:

Process in batches of 100
Show progress indicator
Prioritize recent emails first
Run during low-activity periods

For new emails:

Label immediately on arrival
Update UI in real-time via Pusher
Queue for re-classification if needed

8. Filtering & Navigation
When user clicks a category:

Filter inbox to show only that category
Update URL to /mail/category/[label]
Show count in header
Allow combining with search

Smart Combinations:

"Respond + Meeting" = scheduling requests needing response
"Marketing + Unread" = promotional emails to review
"Pitch + Starred" = interesting opportunities

Implementation Steps
Phase 1: Core Classification (Days 1-3)

Build pattern-based classifier
Integrate GPT-4 fallback
Test accuracy on sample emails
Store labels in database

Phase 2: UI Integration (Days 4-5)

Add auto-labels section to sidebar
Create label badge component
Add badges to email list
Implement category filtering

Phase 3: Background Processing (Days 6-7)

Build batch processor for existing emails
Add real-time labeling for new emails
Implement progress indicators
Add re-classification system

Performance Considerations

Cache label assignments to avoid re-processing
Use database indexes on autoLabels field
Limit AI calls with pattern matching first
Process in background without blocking UI
Show labels immediately, refine with AI async

Success Metrics

90% classification accuracy
<2 second labeling for new emails
All emails labeled within 24 hours
Users click categories 10+ times daily
50% reduction in time finding specific emails