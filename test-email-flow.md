# Email Send Flow Test

## Overview
The email send functionality has been fully implemented with the following flow:

1. **User sends natural language command** (e.g., "send an email to omid@evergreengroup.ai summarizing the use cases of iboga")

2. **System generates draft** with AI-powered content

3. **User sees draft with action buttons**:
   - ✅ **Send Email** (primary action)
   - 🔘 Edit Draft
   - 🔘 Cancel

4. **User can confirm by typing**:
   - "send" or "send it" or "yes send" → Sends the email
   - "cancel" or "no" or "discard" → Cancels the draft
   - Any other command → Processes as new command

## Implementation Details

### Files Updated:

1. **`/lib/evermail/command-processor.ts`**:
   - Added `processCommand` method that accepts confirmation parameter
   - Implemented `sendDraftEmail` method to handle actual sending
   - Returns draft with action buttons for user confirmation

2. **`/lib/ai/command-processor.ts`**:
   - Added `lastEmailDraft` property to store draft for confirmation
   - Detects when user types "send" after seeing a draft
   - Routes confirmation to email processor with draft data
   - Formats email responses with action buttons

3. **`/lib/evermail/gmail-client.ts`**:
   - Updated `sendEmail` method to work with database context
   - Automatically fetches Gmail credentials from database
   - Stores sent emails in entities table
   - Uses OAuth2 tokens for authentication

## How It Works:

### Step 1: Generate Draft
When user requests to send an email, the system:
- Uses OpenAI to generate appropriate content
- Creates a draft object with to, subject, and body
- Returns draft with action buttons

### Step 2: Display Draft
The UI shows:
```
I've created a draft for you to review:

**To:** omid@evergreengroup.ai
**Subject:** Use Cases of Iboga

[Generated email content here...]

---
✅ **Send Email**  🔘 Edit Draft  🔘 Cancel

_Reply with "send" to send this email, "edit" to modify it, or "cancel" to discard._
```

### Step 3: User Confirmation
When user types "send":
- System detects confirmation intent
- Retrieves stored draft
- Calls Gmail API to send email
- Stores sent email in database
- Returns success message

## Testing Instructions:

1. **Ensure Gmail is connected**:
   - Go to `/mail/settings`
   - Click "Connect Gmail"
   - Complete OAuth flow

2. **Test email command**:
   - Go to dashboard (`/dashboard`)
   - Type: "send an email to test@example.com about our Q4 plans"
   - Review the generated draft
   - Type "send" to send the email

3. **Verify email was sent**:
   - Check `/mail/inbox` to see sent email
   - Verify recipient received the email

## Features Implemented:

✅ Natural language email composition
✅ AI-powered content generation
✅ Draft preview with action buttons
✅ Confirmation flow (send/cancel)
✅ Gmail API integration
✅ Database storage of sent emails
✅ Error handling for disconnected accounts
✅ Support for CC/BCC recipients
✅ HTML email formatting

## Example Commands:

1. "Send an email to john@example.com about the meeting tomorrow"
2. "Email sarah@company.com summarizing our product features"
3. "Compose an email to team@startup.com with project update"
4. "Send a follow-up email to client@business.com about the proposal"

## Next Steps:

- Add attachment support
- Implement draft editing UI
- Add email templates
- Support scheduling emails
- Implement email signatures