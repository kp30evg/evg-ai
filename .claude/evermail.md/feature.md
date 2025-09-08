# Master Prompt for Email Integration in Dashboard

Build an email sending feature directly into the main evergreenOS dashboard that allows users to compose and send emails through natural language commands.

## Feature Overview

When a user types a command like "send an email to [email] about [topic]" in the main dashboard command bar, the system should:
1. Generate an email draft using AI
2. Display the draft as the response
3. Show a "Send Email" button
4. Actually send the email when clicked

## Implementation Requirements

### 1. Update Command Processor
**File**: `/lib/modules-simple/command-processor.ts`

Add email sending intent detection:
- Pattern: "send [an] email to [email] about/summarizing [topic]"
- Pattern: "email [person] about [topic]"
- Pattern: "draft email to [email] regarding [topic]"

When detected:
- Extract recipient email
- Extract topic/subject matter
- Route to email composition handler

### 2. Email Composition Handler
**Location**: Add to existing EverMail module or command processor

Process flow:
1. Use OpenAI to generate email content about the topic
2. Format as professional email with:
   - Subject line
   - Greeting
   - Body content (summary/information requested)
   - Professional closing
   - User's signature

3. Return response object with:
   - Type: 'email_draft'
   - Draft content
   - Recipient
   - Subject
   - Action button configuration

### 3. Update Dashboard UI
**File**: `/app/(platform)/dashboard/page.tsx`

Modify the response rendering to handle email drafts:
- When response type is 'email_draft'
- Display formatted email preview
- Show "Send Email" button prominently
- Add "Edit" option if needed

### 4. Email Sending Action
**File**: `/lib/api/routers/unified.ts` or `/lib/api/routers/evermail.ts`

Create endpoint for sending email:
- Accepts draft content, recipient, subject
- Uses existing Gmail integration
- Sends via authenticated user's email account
- Returns confirmation

### 5. Frontend Email Send Handler
**Location**: Dashboard component

When "Send Email" clicked:
- Call send email endpoint
- Show sending state
- Display success confirmation
- Clear command input
- Show "Email sent to [recipient]"

## Example User Flow

1. **User types**: "send an email to kian.pezeshki1@gmail.com summarizing voice agents"

2. **System generates draft**:
```
Subject: Summary of Voice Agents Technology

Hi Kian,

Here's a summary of voice agents technology:

Voice agents are AI-powered systems that use natural language processing and speech recognition to interact with users through voice commands. Key capabilities include:

• Natural conversation handling through advanced NLP
• Integration with business systems and APIs  
• Task automation via voice commands
• Multi-language support
• Context awareness for continued conversations

Popular platforms include Amazon Alexa, Google Assistant, and custom enterprise solutions. They're increasingly used for customer service, internal operations, and hands-free workflows.

Voice agents are transforming business operations by enabling natural, efficient human-computer interaction without traditional interfaces.

Best regards,
[User's name]
```

3. **UI shows**:
   - Email preview in clean format
   - Green "Send Email" button
   - Gray "Edit Draft" option

4. **User clicks "Send Email"**
   - Email sends via Gmail
   - Confirmation: "✓ Email sent to kian.pezeshki1@gmail.com"

## Technical Implementation Details

### Command Processing Update
```typescript
// Add to command classifier
if (command.match(/send.*email.*to.*about|email.*about|draft.*email/i)) {
  const emailMatch = command.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  const topicMatch = command.replace(/.*about|.*summarizing|.*regarding/i, '').trim();
  
  return {
    type: 'compose_email',
    recipient: emailMatch?.[1],
    topic: topicMatch,
    action: 'draft'
  };
}
```

### Response Structure
```typescript
// Return from command processor
{
  type: 'email_draft',
  content: {
    to: 'kian.pezeshki1@gmail.com',
    subject: 'Summary of Voice Agents Technology',
    body: '...',
    bodyHtml: '...'
  },
  actions: [{
    type: 'send_email',
    label: 'Send Email',
    primary: true
  }],
  status: 'draft'
}
```

### UI Rendering
```typescript
// In dashboard component
{response.type === 'email_draft' && (
  <div className="email-draft-container">
    <div className="email-header">
      <div>To: {response.content.to}</div>
      <div>Subject: {response.content.subject}</div>
    </div>
    <div className="email-body">{response.content.body}</div>
    <div className="email-actions">
      <button onClick={() => sendEmail(response.content)}>
        Send Email
      </button>
      <button onClick={() => editDraft(response.content)}>
        Edit
      </button>
    </div>
  </div>
)}
```

## Critical Requirements

1. **Use existing Gmail OAuth** - Don't create new auth flow
2. **Maintain user context** - Send from logged-in user's email
3. **Show clear preview** - User must see what will be sent
4. **Require confirmation** - Never auto-send without click
5. **Handle errors gracefully** - If Gmail fails, show clear error
6. **Save to sent folder** - Email should appear in Gmail sent items

## Success Criteria

- User can compose email via natural language
- Draft appears in dashboard with correct formatting
- Send button successfully sends email
- Recipient receives properly formatted email
- Confirmation shows in UI
- Entire flow takes <5 seconds

## Edge Cases to Handle

- Invalid email address → Show error, request correction
- No Gmail connected → Prompt to connect email first
- Topic too vague → Ask for clarification
- Send fails → Show error with retry option
- Multiple recipients → Parse and handle all

This feature turns the dashboard into a universal command center where users can execute complex actions like sending emails without leaving the main interface.