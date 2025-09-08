# evergreenOS - The Unified Business Operating System

## Mission
evergreenOS represents the most fundamental shift in enterprise technology since the internet. We're not building another SaaS platform - we're obsoleting the entire concept of business software interfaces. Through natural language commands and autonomous orchestration across unified data, we enable any business to operate with the efficiency of a single organism rather than disconnected departments. a unified business operating system that replaces 50+ fragmented business tools with a single platform controlled by natural language commands. All data lives in a single PostgreSQL database with JSONB fields, enabling true unification across all business functions.



## Core Philosophy
1. **One Table**: ALL business data in a single `entities` table with JSONB
2. **One Language**: Every action accessible via natural language
3. **One Truth**: No data silos, no sync issues, no integration hell
4. **Infinite Scale**: Add any department/module without changing core architecture

## ⚠️ CRITICAL: UI/UX Design Requirements

**BEFORE ANY UI CHANGES:**
1. **MUST** read `/context/style-guide.md` and `/context/design-principles.md`
2. **MUST** use exact brand colors, typography, and spacing from style guide
3. **MUST** use Playwright MCP to reference existing UI for consistency
4. **MUST** invoke `@agent-design-review` for significant changes
5. **MUST** save all screenshots to `.screenshots/` directory

**Our product MUST look beautiful and professional. Design quality is NON-NEGOTIABLE.**

# Product Architecture: The Unfair Advantage

## Core Technical Moats

### 1. Single Data Model Architecture
- **Traditional:** 100+ separate databases → integration nightmare  
- **evergreenOS:** One canonical data structure → zero integration needed  
> This cannot be retrofitted. Competitors would need complete rebuilds.

---

### 2. Natural Language Business Layer
- Not a chatbot overlay — native command processing  
- Context spans entire business, not single functions  
- Commands trigger complex orchestrations, not simple queries  
- Self-improving with every interaction across all customers  

---

### 3. Autonomous Orchestration Engine
- Pre-built intelligence for 10,000+ business scenarios  
- Cross-functional workflows that self-assemble  
- Predictive intervention before problems occur  
- Zero configuration required  


## 🔒 CRITICAL: Multi-Tenancy & User Data Isolation Architecture

### Organization Structure
evergreenOS implements a **hierarchical multi-tenant architecture** with complete data isolation:

```
┌─────────────────────────────────────────────┐
│           CLERK AUTHENTICATION              │
│                                              │
│  Organization (Clerk Org)                   │
│  ├── User A (Clerk User)                    │
│  │   ├── Personal Gmail Account             │
│  │   ├── Personal Calendar                  │
│  │   └── Created Contacts/Deals             │
│  │                                           │
│  ├── User B (Clerk User)                    │
│  │   ├── Personal Gmail Account             │
│  │   ├── Personal Calendar                  │
│  │   └── Created Contacts/Deals             │
│  │                                           │
│  └── User C (Admin)                         │
│      └── Can see organization-wide data     │
│                                              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            NEON DATABASE                     │
│                                              │
│  workspaces table                           │
│  ├── Maps Clerk Org → Workspace UUID        │
│  └── Organization settings                  │
│                                              │
│  users table                                 │
│  ├── Maps Clerk User → Database User UUID   │
│  ├── Links to workspace_id                  │
│  └── User preferences                       │
│                                              │
│  entities table                              │
│  ├── workspace_id (organization isolation)  │
│  ├── user_id (user-level ownership)         │
│  └── All business data                      │
│                                              │
└─────────────────────────────────────────────┘
```

### Data Isolation Levels

#### 1. **Workspace Isolation** (Organization-level)
- All queries MUST filter by `workspace_id`
- Prevents data leakage between organizations
- Implemented at database query level

#### 2. **User Isolation** (Personal data)
- OAuth accounts (Gmail, Calendar) filtered by `user_id`
- Personal emails, calendar events owned by specific user
- Contacts/deals can be user-specific or organization-wide

#### 3. **Shared Organization Data**
- Some entities (like company profiles) may be workspace-wide
- Team messages in channels visible to all users
- Shared deals visible to sales team

### Critical Implementation Requirements

```typescript
// EVERY data query MUST include user context
interface QueryContext {
  workspaceId: string;  // REQUIRED - from Clerk org
  userId?: string;      // REQUIRED for personal data
  role?: string;        // For permission checks
}

// Example: Fetching user's emails
const emails = await db
  .select()
  .from(entities)
  .where(
    and(
      eq(entities.workspaceId, ctx.workspaceId),  // Organization isolation
      eq(entities.userId, ctx.userId),             // User isolation
      eq(entities.type, 'email')
    )
  );

// Example: Creating an entity
const entity = await entityService.create(
  workspaceId,
  'contact',
  data,
  relationships,
  { userId: ctx.userId }  // CRITICAL: Always pass userId
);
```

### User Sync Process

1. **Clerk Webhook** (`/app/api/webhooks/clerk/route.ts`)
   - Listens for user creation/updates from Clerk
   - Creates/updates records in `users` table
   - Links users to workspaces

2. **Manual Sync** (if webhook fails)
   ```bash
   npx tsx scripts/sync-users-simple.ts
   ```

3. **Database User Lookup**
   ```typescript
   // Convert Clerk user ID to database user ID
   const [dbUser] = await db
     .select()
     .from(users)
     .where(eq(users.clerkUserId, clerkUserId))
     .limit(1);
   ```

### OAuth Account Isolation

Each user's OAuth accounts (Gmail, Calendar, etc.) are **completely isolated**:

```typescript
// Gmail account storage
{
  workspace_id: "org-uuid",
  user_id: "user-uuid",        // CRITICAL: User ownership
  type: "email_account",
  data: {
    email: "user@gmail.com",
    tokens: "encrypted",       // User's personal OAuth tokens
    provider: "gmail"
  }
}
```

### Security Checklist for New Features

- [ ] Does the feature filter by `workspace_id`?
- [ ] Does it filter by `user_id` for personal data?
- [ ] Are OAuth tokens stored per user?
- [ ] Is the users table populated from Clerk?
- [ ] Are all API endpoints checking user context?
- [ ] Is sensitive data properly isolated?

### Common Mistakes to Avoid

❌ **DON'T** query without workspace_id
```typescript
// WRONG - exposes data across organizations
const data = await db.select().from(entities);
```

❌ **DON'T** share OAuth tokens between users
```typescript
// WRONG - everyone sees same Gmail account
const account = { type: 'email_account', data: { tokens } };
```

❌ **DON'T** forget to sync users from Clerk
```typescript
// WRONG - users table empty, no isolation possible
// MUST run sync script after adding users
```

✅ **DO** always include proper context
```typescript
// CORRECT - properly isolated query
const data = await entityService.find({
  workspaceId: ctx.workspaceId,
  userId: ctx.userId,
  type: 'email'
});
```

## Architecture Foundation

### The Universal Data Model
```sql
-- This ONE table holds EVERYTHING - contacts, emails, tasks, invoices, messages, files
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,  -- Organization/workspace isolation
  user_id UUID,                 -- User-level data ownership (CRITICAL for privacy)
  type VARCHAR(50),             -- infinitely extensible: 'contact', 'email', 'task', 'invoice', etc.
  data JSONB,                   -- flexible schema for any data structure
  relationships JSONB[],         -- connections between entities
  metadata JSONB,                -- system metadata
  search_vector tsvector,        -- full-text search
  embedding vector(1536),        -- semantic search
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- This simple structure can hold:
-- A contact: {type: 'contact', data: {name: 'John', email: 'john@example.com'}}
-- An email: {type: 'email', data: {subject: 'Deal', from: 'john@example.com'}}
-- A task: {type: 'task', data: {title: 'Follow up', related_to: [contact_id, email_id]}}
-- An invoice: {type: 'invoice', data: {amount: 1000, customer_id: contact_id}}
```

### The Module System
```typescript
// Context MUST include user information for ALL operations
interface Context {
  workspaceId: string;    // Organization identifier (from Clerk)
  userId: string;         // Database user UUID (from users table)
  clerkUserId?: string;   // Original Clerk user ID
  role?: 'admin' | 'member' | 'viewer';
  userEmail?: string;     // For email-specific operations
}

// Every module MUST implement this interface
interface Module {
  // Identity
  name: string           // 'evercore', 'evermail', etc.
  version: string        // '1.0.0'
  description: string    // What this module does
  
  // Entity types this module manages
  entityTypes: string[]  // ['contact', 'company', 'deal']
  
  // Natural language commands this module handles
  commands: CommandDefinition[]
  
  // Core CRUD operations - ALL require Context with userId
  create(type: string, data: any, context: Context): Promise<Entity>
  read(id: string, context: Context): Promise<Entity>
  update(id: string, data: any, context: Context): Promise<Entity>
  delete(id: string, context: Context): Promise<boolean>
  search(query: string, filters: any, context: Context): Promise<Entity[]>
  
  // Command handling
  canHandleCommand(command: ParsedCommand): boolean
  executeCommand(command: ParsedCommand, context: Context): Promise<CommandResult>
  
  // Cross-module operations
  getRelatedEntities(entityId: string, targetType: string): Promise<Entity[]>
  linkEntities(sourceId: string, targetId: string, relationship: string): Promise<void>
  
  // Import/Export
  importData(source: string, credentials: any, options: any): Promise<ImportResult>
  exportData(filters: any, format: string): Promise<ExportResult>
  
  // Lifecycle
  install(context: Context): Promise<void>
  uninstall(context: Context): Promise<void>
  upgrade(fromVersion: string, toVersion: string): Promise<void>
}
```
# evergreenOS MVP Development Guide

## System Architecture Overview

Build a unified business operating system with a single data model that will eventually support 20+ departments. Start with 10 core modules that prove the concept.

### Core Database Architecture

```sql
-- Single table for ALL business entities (scalable to any department)
CREATE TABLE entities (
    id UUID PRIMARY KEY,
    type VARCHAR(50), -- infinitely extensible
    company_id UUID NOT NULL,
    data JSONB NOT NULL, -- flexible schema
    relationships JSONB[],
    metadata JSONB,
    indexed_content TEXT
);

```

## Build Order

### Phase 1: Foundation

**Core Infrastructure**

- Single entity database (must support future departments)
- Authentication system with workspace management
- Natural language processing pipeline
- Base API layer (GraphQL/tRPC)

### Phase 2: Communication Layer

**EverChat**

- Slack import
- Real-time messaging
- Search functionality
- Commands: "Summarize discussions about [topic]"

**EverMail**

- Gmail sync
- Thread management
- Auto-contact creation
- Commands: "Show emails from important customers"

### Phase 3: Time & Intelligence

**EverCal**

- Calendar sync
- Meeting scheduling from any module
- Commands: "Schedule follow-ups for stalled deals"

### Phase 4: Workflow Layer

**EverCore (CRM)**

- Contact/deal management
- Pipeline tracking
- Auto-link to communications
- Commands: "Show deals at risk"


so many more to come. 

# ⚠️ CRITICAL: Dashboard AI Integration - DO NOT BREAK

## The Dashboard MUST Always Work
The main dashboard at `/app/(platform)/dashboard/page.tsx` is the heart of evergreenOS. It MUST:
1. **Always respond to natural language commands** using the OpenAI integration
2. **Always handle general questions** like ChatGPT would (fallback to OpenAI)
3. **Always process business commands** for EverCore, EverChat, EverCal, EverMail modules
4. **Always show real data** from the database, never fake responses

## Command Processing Chain (DO NOT MODIFY WITHOUT TESTING)
```
User Input → /lib/modules-simple/command-processor.ts → Module Handlers → OpenAI Fallback
```

### Key Files That MUST Stay Connected:
1. **Dashboard UI**: `/app/(platform)/dashboard/page.tsx`
   - Uses: `trpc.unified.executeCommand.useMutation()`
   - NEVER change this mutation call

2. **API Router**: `/lib/api/routers/unified.ts`
   - Endpoint: `executeCommand`
   - Calls: `processCommand(workspaceId, input.command, userId)`
   - NEVER break this connection

3. **Command Processor**: `/lib/modules-simple/command-processor.ts`
   - Handles ALL natural language input
   - Routes to: EverChat, EverCore, EverCal, EverMail
   - Falls back to OpenAI for general questions
   - MUST have OPENAI_API_KEY in environment

4. **Module Handlers**:
   - `/lib/modules-simple/evercore.ts` - CRM commands
   - `/lib/modules-simple/everchat.ts` - Chat/messaging
   - `/lib/modules-simple/evercal.ts` - Calendar
   - `/lib/evermail/command-processor.ts` - Email

## Testing Commands That MUST Work:
```
✅ "What are voice agents?" → OpenAI general knowledge response
✅ "Summarize my contacts" → Real contact data from database
✅ "What is my biggest deal?" → Real deal data from database
✅ "Show my meetings today" → Real calendar events
✅ "Send john@example.com an email about pricing" → Email draft creation
```

## Environment Variables Required:
```
OPENAI_API_KEY=sk-... (MUST be set for AI to work)
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=...
```

## If Dashboard Stops Working:
1. Check `npm run dev` console for errors
2. Verify OPENAI_API_KEY is set in `.env.local`
3. Check these connections are intact:
   - Dashboard → unified.executeCommand
   - unified.executeCommand → processCommand
   - processCommand → OpenAI client initialization
4. Test with: "What is 2+2?" (should use OpenAI)
5. Test with: "Summarize my contacts" (should use EverCore)
6. Test with: "Send test@example.com an email about testing" (should show email draft)

## Common Issues & Fixes:
- **"Command not recognized"**: Check command processor regex patterns
- **500 error on commands**: Check OPENAI_API_KEY is set
- **No real data shown**: Verify database connection and workspace creation
- **Commands return generic text**: Check module handler response formatting
- **Users seeing same data**: Check user_id filtering and users table sync
- **Empty users table**: Run `npx tsx scripts/sync-users-simple.ts`
- **OAuth shared between users**: Ensure userId is stored with OAuth accounts
- **Email draft not showing**: Check command processor handleEmail function
- **Send button not working**: Verify unified.sendEmail endpoint exists
- **"Gmail not connected" error**: User needs to connect Gmail at /mail/settings

## 📧 CRITICAL: Email Sending Feature
The dashboard supports sending emails via natural language commands. This feature is CRITICAL and must always work.

**Architecture:**
1. Command: "send [email] an email about [topic]"
2. AI generates professional email draft
3. Dashboard shows draft with Send/Edit/Cancel buttons
4. Send button calls unified.sendEmail → GmailClient
5. Email sent via user's connected Gmail account

**Files involved:**
- `/lib/modules-simple/command-processor.ts` - Handles email draft commands
- `/app/(platform)/dashboard/page.tsx` - Renders email drafts and buttons
- `/lib/api/routers/unified.ts` - sendEmail endpoint
- `/lib/evermail/gmail-client.ts` - Gmail API integration

**Testing:** Run `npx tsx scripts/test-email-feature.ts` to verify everything works

---

# 🚨 CRITICAL SECURITY REMINDERS FOR ALL DEVELOPMENT

## User Data Isolation is NON-NEGOTIABLE

**EVERY feature you build MUST:**
1. Filter by `workspace_id` to prevent cross-organization data leaks
2. Filter by `user_id` for personal data (emails, calendar, OAuth accounts)
3. Ensure the `users` table is synced from Clerk before testing
4. Store OAuth tokens PER USER, never per workspace
5. Pass user context through ALL module operations

**Before ANY data query:**
```typescript
// ALWAYS get the database user first
const [dbUser] = await db
  .select()
  .from(users)
  .where(eq(users.clerkUserId, clerkUserId))
  .limit(1);

// Then use their ID for queries
const data = await entityService.find({
  workspaceId: workspaceId,
  userId: dbUser.id,  // CRITICAL
  type: 'email'
});
```

**Testing Multi-User Scenarios:**
1. Create 2+ users in the same workspace
2. Each user connects their own Gmail/Calendar
3. Verify User A CANNOT see User B's data
4. Test with admin vs regular member roles

**Quick Check Commands:**
- Check users table: `SELECT * FROM users;`
- Check user isolation: `SELECT DISTINCT user_id FROM entities WHERE type = 'email';`
- Verify workspace: `SELECT * FROM workspaces WHERE clerk_org_id = 'org_...';`

## Remember: One security breach can destroy trust forever. Always verify isolation.