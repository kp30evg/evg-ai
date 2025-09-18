# CRITICAL FIX: Email Sending Feature

## ⚠️ THIS FEATURE IS CRITICAL AND MUST ALWAYS WORK

### The Problem (What Was Breaking)
When users typed commands like "send an email to kian.pezeshki1@gmail about puma", the system was:
1. Returning literal "X" and "Y" instead of extracting the actual email and topic
2. Failing to parse incomplete email addresses (missing .com)
3. Showing "I encountered an error processing your request" instead of generating email drafts

### The Fix Applied

#### 1. Command Parser Prompt (`/lib/modules-simple/command-processor.ts` lines 97-113)
The OpenAI prompt MUST include specific examples with ACTUAL email addresses, not placeholders:

```typescript
For email draft/send commands like "send email to john@example.com about puma":
- Extract the ACTUAL email address (not "X"), e.g., "john@example.com"
- Extract the ACTUAL topic (not "Y"), e.g., "puma"
- Return: {"action":"email","parameters":{"command":"draft","to":"john@example.com","topic":"puma"},"response":"Drafting email..."}

Examples:
- "send email to kian.pezeshki1@gmail about puma" -> {"action":"email","parameters":{"command":"draft","to":"kian.pezeshki1@gmail.com","topic":"puma"},"response":"Drafting email..."}
- "email sarah@company.com about the project update" -> {"action":"email","parameters":{"command":"draft","to":"sarah@company.com","topic":"the project update"},"response":"Drafting email..."}
```

#### 2. Email Validation Fix (`/lib/modules-simple/command-processor.ts` lines 214-219)
Auto-correct common email typos:

```typescript
// Fix common email typos - add .com if missing
let emailAddress = params.to;
if (emailAddress.includes('@') && !emailAddress.includes('.')) {
  // If there's an @ but no dot, assume .com was forgotten
  emailAddress = emailAddress + '.com';
}
```

#### 3. Use Corrected Email Throughout
The corrected `emailAddress` variable must be used in:
- Email validation
- OpenAI prompt for draft generation
- Response message
- Draft data object

### Testing Commands That MUST Work
✅ "send email to john@example.com about pricing"
✅ "send an email to kian.pezeshki1@gmail about puma"
✅ "email sarah@company about the meeting" (auto-adds .com)
✅ "draft email to bob@test.org regarding project update"

### Common Failure Points to Check
1. **OpenAI prompt returns "X" and "Y"**: The prompt MUST have real examples, not placeholders
2. **Email validation fails**: Check the auto-correction logic for missing domains
3. **JSON parsing fails**: Ensure the OpenAI response is valid JSON
4. **Send button doesn't work**: Verify unified.sendEmail endpoint exists

### Files Involved
- `/lib/modules-simple/command-processor.ts` - Main command processing and email parsing
- `/app/(platform)/dashboard/page.tsx` - UI rendering and Send button
- `/lib/api/routers/unified.ts` - sendEmail endpoint
- `/lib/evermail/gmail-client.ts` - Gmail API integration

### DO NOT MODIFY WITHOUT TESTING
This feature is mentioned in CLAUDE.md as CRITICAL. Any changes must be tested with all the commands above.