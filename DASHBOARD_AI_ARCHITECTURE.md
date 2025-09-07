# Dashboard AI Architecture & Command Processing

## Overview
The dashboard AI integration is the heart of evergreenOS, enabling natural language control of all business operations. This document explains how it works and how to maintain it.

## 🔒 Security-First Architecture

### User Isolation is MANDATORY
Every piece of data in evergreenOS is isolated by:
1. **Workspace ID** - Organization-level isolation
2. **User ID** - Personal data isolation (emails, calendar, etc.)

**NEVER** query data without both IDs when dealing with user-specific content.

## Command Processing Flow

```
User Input (Dashboard UI)
    ↓
tRPC API (unified.executeCommand)
    ↓
createCommandContext() - Validates & creates secure context
    ↓
processCommand() - Routes to appropriate handler
    ↓
Module Handlers (EverCore, EverMail, EverChat, EverCal)
    ↓
OpenAI Fallback (for general questions)
    ↓
Response with data/suggestions
```

## Key Components

### 1. Command Context (`/lib/modules-simple/command-context.ts`)
```typescript
interface CommandContext {
  workspaceId: string;    // REQUIRED - Organization isolation
  userId: string;         // REQUIRED - User isolation
  clerkUserId: string;    // REQUIRED - Original Clerk ID
  userEmail?: string;     // Optional - For email operations
}
```

**Purpose**: Enforces type-safe user isolation across all operations.

### 2. Command Processor (`/lib/modules-simple/command-processor.ts`)
- **Entry Point**: `processCommand(workspaceId, command, clerkUserId)`
- **Responsibilities**:
  - Convert Clerk user ID to database user ID
  - Route commands to appropriate modules
  - Fall back to OpenAI for general questions
  - Log command execution for monitoring

### 3. Module Handlers
Each module handles specific command types:
- **EverCore**: CRM operations (contacts, companies, deals)
- **EverMail**: Email operations (send, search, summarize)
- **EverChat**: Messaging (send to channels, DMs)
- **EverCal**: Calendar operations (meetings, scheduling)

### 4. OpenAI Integration
- **When Used**: When no specific module pattern matches
- **Purpose**: Answer general business questions, provide advice
- **Requirement**: `OPENAI_API_KEY` must be set in environment

## Command Routing Logic

```typescript
// Simplified routing logic
if (command.includes('email')) → handleEmailCommand()
else if (command.includes('contact')) → evercore.handleCoreCommand()
else if (command.includes('message')) → everchat.handleChatCommand()
else if (command.includes('meeting')) → handleCalendarCommand()
else → OpenAI fallback
```

## Critical Security Checks

### 1. User Context Validation
```typescript
// ALWAYS validate context before operations
validateContext(context);  // Throws if invalid
```

### 2. Data Filtering
```typescript
// ALWAYS filter by both workspace AND user
const emails = await entityService.find({
  workspaceId: context.workspaceId,
  userId: context.userId,  // CRITICAL!
  type: 'email'
});
```

### 3. Error Handling
```typescript
// ALWAYS catch and log errors
try {
  // ... command processing
} catch (error) {
  logCommandExecution(context, command, { success: false, error });
  // Return user-friendly error
}
```

## Testing & Monitoring

### Automated Tests
```bash
# Test user isolation
npx tsx scripts/test-command-isolation.ts

# Test single command
npx tsx scripts/test-single-command.ts "your command here"

# Monitor system health
npx tsx scripts/monitor-dashboard-health.ts
```

### Health Checks
The monitoring script checks:
- ✅ Database connection
- ✅ User sync status
- ✅ OpenAI integration
- ✅ User isolation integrity
- ✅ Recent command errors

## Common Issues & Solutions

### Issue: "Command not recognized"
**Cause**: Pattern matching failed in command processor
**Solution**: Check routing conditions in `processCommand()`

### Issue: Users see each other's data
**Cause**: Missing userId filter
**Solution**: 
1. Check that `userId` is passed to all queries
2. Run isolation tests: `npx tsx scripts/test-command-isolation.ts`

### Issue: 500 errors on commands
**Cause**: Usually undefined userId or missing OpenAI key
**Solution**:
1. Check environment variables
2. Ensure users table is synced: `npx tsx scripts/sync-users-simple.ts`

### Issue: OpenAI not responding
**Cause**: Missing or invalid API key
**Solution**: Check `OPENAI_API_KEY` in `.env` file

## Development Guidelines

### Adding New Commands

1. **Define the pattern** in `processCommand()`:
```typescript
if (lowerCommand.includes('your_keyword')) {
  return await handleYourCommand(context, command);
}
```

2. **Create handler function** with proper typing:
```typescript
async function handleYourCommand(
  context: CommandContext,  // REQUIRED
  command: string
): Promise<CommandResult> {
  validateContext(context);  // ALWAYS validate
  // ... implementation
}
```

3. **Test isolation**:
```typescript
// Ensure data is filtered by userId
const data = await entityService.find({
  workspaceId: context.workspaceId,
  userId: context.userId,  // CRITICAL
  type: 'your_type'
});
```

### TypeScript Configuration
The project uses strict TypeScript settings to catch errors:
- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - Catch unused variables
- `noUnusedParameters: true` - Catch unused parameters
- `noImplicitReturns: true` - Ensure all paths return
- `noUncheckedIndexedAccess: true` - Safe array access

## Deployment Checklist

Before deploying any changes to command processing:

- [ ] Run isolation tests: `npx tsx scripts/test-command-isolation.ts`
- [ ] Run health check: `npx tsx scripts/monitor-dashboard-health.ts`
- [ ] Verify environment variables are set
- [ ] Check that users table is synced
- [ ] Test all major command types
- [ ] Review error logs

## Emergency Procedures

### If User Data Leak Detected:
1. **IMMEDIATELY** disable the affected endpoint
2. Run isolation tests to identify the issue
3. Check all queries for missing userId filters
4. Deploy fix with proper validation
5. Audit all affected data

### If All Commands Failing:
1. Check OpenAI API key validity
2. Verify database connection
3. Check user sync status
4. Review recent code changes
5. Roll back if necessary

## Monitoring in Production

### Key Metrics to Track:
- Command success rate
- Average response time
- User isolation violations (should be 0)
- OpenAI API usage
- Error rates by command type

### Alerts to Set Up:
- Any user isolation violation
- Command success rate < 95%
- OpenAI API errors > 1%
- Database connection failures
- Missing userId in queries

## Conclusion

The dashboard AI is the core of evergreenOS. It MUST:
1. **Always** maintain user isolation
2. **Always** validate context before operations
3. **Always** handle errors gracefully
4. **Always** fall back to OpenAI for general questions

Follow these guidelines and run the provided tests to ensure the system remains secure and functional.