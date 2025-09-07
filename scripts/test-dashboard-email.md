# Email Flow Test Instructions

## Complete Flow:
1. **User Command**: "send kian@evergreengroup.ai an email about voice agents"
   - Dashboard calls `executeCommand` mutation
   - Command processor generates AI content about voice agents
   - Creates email_draft entity in database
   - Returns type: 'draft_email' with draft data

2. **Dashboard Display**:
   - Shows email preview with To, Subject, and Body
   - Displays Send/Edit/Cancel buttons
   - User reviews the AI-generated content

3. **User Clicks Send**:
   - Dashboard calls `executeCommand` with "send {draft_id}"
   - Command processor retrieves draft from database
   - Sends email via Gmail API using stored OAuth tokens
   - Updates draft status to 'sent'
   - Returns success message

## Testing Steps:
1. Open http://localhost:3000/dashboard
2. Type: "send kian@evergreengroup.ai an email about voice agents"
3. Review the generated email draft
4. Click "Send Email" button
5. Verify success message

## What's Implemented:
- ✅ AI content generation with GPT-4
- ✅ Draft storage in database (not Gmail drafts)
- ✅ Dashboard UI with action buttons
- ✅ Gmail API integration for sending
- ✅ User-specific OAuth token isolation
- ✅ Complete error handling

## Key Files:
- `/lib/modules-simple/command-processor.ts` - Handles commands
- `/app/(platform)/dashboard/page.tsx` - Dashboard UI
- `/lib/evermail/gmail-client.ts` - Gmail API integration
