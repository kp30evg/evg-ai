# evergreenOS Technical Implementation Guide

## Project Overview

evergreenOS is a unified business operating system that replaces 50+ fragmented business tools with a single platform controlled by natural language commands. This guide covers building 10 core modules with architecture supporting infinite expansion.


## Core Architecture Principles

### 1. Unified Data Model
All business data lives in a single, flexible schema that can accommodate any future module without database changes.

### 2. Natural Language First
Every action can be triggered via natural language commands that work across all modules simultaneously.

### 3. Module Extensibility
New departments/modules can be added without touching core architecture.

## Technology Stack

```yaml
Frontend:
  Framework: Next.js 15.0.3
  Language: TypeScript 5.3
  Styling: Tailwind CSS 3.4 + shadcn/ui
  State: Zustand + React Query
  
Backend:
  Runtime: Node.js 20 LTS
  API: tRPC (type-safe, simpler than GraphQL)
  Database: Neon PostgreSQL
  ORM: Drizzle 0.33
  Cache: Redis (Upstash)
  
Authentication:
  Provider: Clerk (organizations, SAML, SSO)
  Sessions: Database-backed via Clerk
  
Payments:
  Provider: Stripe
  Model: Subscription + usage-based
  
AI/NLP:
  Primary: OpenAI GPT-4
  Fallback: Anthropic Claude
  Monitoring: Helicone
  
Integrations:
  Google: OAuth + APIs (Gmail, Calendar, Drive)
  Salesforce: jsforce
  QuickBooks: SDK
  Slack: Web API
  
Infrastructure:
  Hosting: Vercel
  Storage: Cloudflare R2
  Queue: BullMQ
  Realtime: Pusher
  Monitoring: Sentry
  Analytics: PostHog
```

## Database Schema

```sql
-- Core unified entity table
CREATE TABLE entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'contact', 'deal', 'task', 'email', etc.
  data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', data->>'content' || ' ' || data->>'name' || ' ' || data->>'description')
  ) STORED,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INT DEFAULT 1
);

-- Indexes for performance
CREATE INDEX idx_entities_company ON entities(company_id);
CREATE INDEX idx_entities_type ON entities(company_id, type);
CREATE INDEX idx_entities_search ON entities USING GIN(search_vector);
CREATE INDEX idx_entities_data ON entities USING GIN(data);
CREATE INDEX idx_entities_relationships ON entities USING GIN(relationships);

-- Audit log for compliance
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  entity_id UUID,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Command history for ML training
CREATE TABLE command_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  input TEXT NOT NULL,
  intent JSONB,
  entities_referenced UUID[],
  result JSONB,
  success BOOLEAN,
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_isolation ON entities
  FOR ALL
  USING (company_id = current_setting('app.company_id', TRUE)::uuid);
```

## Module Architecture

```typescript
// Base module interface - all modules implement this
interface Module {
  name: string;
  version: string;
  entityTypes: string[];
  
  // Commands this module can handle
  commands: CommandDefinition[];
  
  // Relationships to other modules
  relationships: RelationshipDefinition[];
  
  // Core operations
  create(data: any, context: Context): Promise<Entity>;
  read(id: string, context: Context): Promise<Entity>;
  update(id: string, data: any, context: Context): Promise<Entity>;
  delete(id: string, context: Context): Promise<boolean>;
  search(query: string, context: Context): Promise<Entity[]>;
  
  // Natural language handlers
  handleCommand(command: ParsedCommand, context: Context): Promise<CommandResult>;
  
  // Integration points
  import(source: string, data: any, context: Context): Promise<ImportResult>;
  export(format: string, filters: any, context: Context): Promise<ExportResult>;
  
  // Lifecycle hooks
  onInstall(context: Context): Promise<void>;
  onUpgrade(fromVersion: string, context: Context): Promise<void>;
  onUninstall(context: Context): Promise<void>;
}
```

## Module Implementations

### 1. EverCore (CRM)

```typescript
class EverCoreModule implements Module {
  name = 'evercore';
  entityTypes = ['contact', 'company', 'deal', 'activity'];
  
  commands = [
    {
      pattern: 'show deals closing this month',
      handler: this.dealsClosingThisMonth
    },
    {
      pattern: 'why did we lose {customer}',
      handler: this.analyzeLostDeal
    }
  ];
  
  async dealsClosingThisMonth(context: Context) {
    const deals = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, context.companyId),
          eq(entities.type, 'deal'),
          gte(entities.data->>'closeDate', startOfMonth()),
          lte(entities.data->>'closeDate', endOfMonth())
        )
      );
    return { deals, summary: `${deals.length} deals worth $${totalValue}` };
  }
}
```

### 2. EverMail (Email)

```typescript
class EverMailModule implements Module {
  name = 'evermail';
  entityTypes = ['email', 'thread', 'attachment'];
  
  async syncGmail(accessToken: string, context: Context) {
    const gmail = google.gmail({ version: 'v1', auth: accessToken });
    const messages = await gmail.users.messages.list({ userId: 'me' });
    
    for (const message of messages.data.messages) {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      });
      
      await this.create({
        type: 'email',
        data: {
          messageId: full.data.id,
          threadId: full.data.threadId,
          subject: this.extractHeader(full.data, 'Subject'),
          from: this.extractHeader(full.data, 'From'),
          to: this.extractHeader(full.data, 'To'),
          body: this.extractBody(full.data),
          timestamp: new Date(parseInt(full.data.internalDate))
        }
      }, context);
    }
  }
}
```

### 3. EverChat (Team Communication)

```typescript
class EverChatModule implements Module {
  name = 'everchat';
  entityTypes = ['message', 'channel', 'thread'];
  
  async importSlack(token: string, context: Context) {
    const slack = new WebClient(token);
    const channels = await slack.conversations.list();
    
    for (const channel of channels.channels) {
      const messages = await slack.conversations.history({
        channel: channel.id
      });
      
      for (const message of messages.messages) {
        await this.create({
          type: 'message',
          data: {
            channel: channel.name,
            user: message.user,
            text: message.text,
            timestamp: message.ts
          }
        }, context);
      }
    }
  }
}
```

### 4. EverTask (Task Management)

```typescript
class EverTaskModule implements Module {
  name = 'evertask';
  entityTypes = ['task', 'project', 'milestone'];
  
  commands = [
    {
      pattern: 'create task from this email',
      handler: this.createFromEmail
    },
    {
      pattern: 'what is blocking {project}',
      handler: this.findBlockers
    }
  ];
  
  async createFromEmail(emailId: string, context: Context) {
    const email = await db.select().from(entities).where(
      and(
        eq(entities.id, emailId),
        eq(entities.type, 'email')
      )
    ).single();
    
    return await this.create({
      type: 'task',
      data: {
        title: `Follow up: ${email.data.subject}`,
        description: email.data.body,
        source: 'email',
        sourceId: emailId
      }
    }, context);
  }
}
```

### 5. EverCal (Calendar)

```typescript
class EverCalModule implements Module {
  name = 'evercal';
  entityTypes = ['event', 'availability', 'booking'];
  
  async scheduleFromDeal(dealId: string, context: Context) {
    const deal = await this.getDeal(dealId, context);
    const contact = await this.getContact(deal.data.contactId, context);
    
    return await this.create({
      type: 'event',
      data: {
        title: `Follow-up: ${deal.data.name}`,
        attendees: [contact.data.email],
        dealId: dealId,
        duration: 30
      }
    }, context);
  }
}
```

### 6-10. Additional Modules

```typescript
// EverBooks (Light Finance)
class EverBooksModule implements Module {
  entityTypes = ['invoice', 'payment', 'expense'];
}

// EverDocs (Documents)
class EverDocsModule implements Module {
  entityTypes = ['document', 'template', 'version'];
}

// EverSign (E-signatures)
class EverSignModule implements Module {
  entityTypes = ['envelope', 'signature', 'audit_trail'];
}

// EverDrive (File Storage)
class EverDriveModule implements Module {
  entityTypes = ['file', 'folder', 'share'];
}

// EverSight (Analytics)
class EverSightModule implements Module {
  entityTypes = ['report', 'dashboard', 'metric'];
  
  async analyzeAcrossModules(query: string, context: Context) {
    // This module can query all other modules
    const allData = await db.select().from(entities)
      .where(eq(entities.companyId, context.companyId));
    
    // Use AI to analyze patterns
    const analysis = await openai.complete({
      prompt: `Analyze this business data: ${JSON.stringify(allData)}
               Question: ${query}`,
      model: 'gpt-4'
    });
    
    return analysis;
  }
}
```

## Natural Language Processing

```typescript
class CommandProcessor {
  private modules: Map<string, Module> = new Map();
  
  registerModule(module: Module) {
    this.modules.set(module.name, module);
    // Register command patterns
    module.commands.forEach(cmd => {
      this.registerCommand(cmd);
    });
  }
  
  async process(input: string, context: Context): Promise<CommandResult> {
    // Track for learning
    const startTime = Date.now();
    
    try {
      // 1. Parse intent
      const intent = await this.parseIntent(input);
      
      // 2. Extract entities
      const entities = await this.extractEntities(input, context);
      
      // 3. Identify relevant modules
      const modules = this.identifyModules(intent, entities);
      
      // 4. Execute across modules
      const results = await this.orchestrate(modules, intent, entities, context);
      
      // 5. Log success
      await this.logCommand({
        input,
        intent,
        entities: entities.map(e => e.id),
        success: true,
        executionTime: Date.now() - startTime
      }, context);
      
      return results;
      
    } catch (error) {
      // Log failure for improvement
      await this.logCommand({
        input,
        error: error.message,
        success: false,
        executionTime: Date.now() - startTime
      }, context);
      
      throw error;
    }
  }
  
  private async parseIntent(input: string): Promise<Intent> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Extract intent and entities from business commands'
      }, {
        role: 'user',
        content: input
      }],
      functions: [
        {
          name: 'extract_intent',
          parameters: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              target: { type: 'string' },
              filters: { type: 'object' },
              timeframe: { type: 'string' }
            }
          }
        }
      ]
    });
    
    return JSON.parse(response.choices[0].function_call.arguments);
  }
}
```

## Cross-Module Orchestration

```typescript
class Orchestrator {
  async executeComplexCommand(
    command: string,
    context: Context
  ): Promise<OrchestrationResult> {
    // Example: "Close the deal with TechCorp"
    
    const steps = [
      {
        module: 'everdocs',
        action: 'generate',
        params: { template: 'contract', dealId: 'xxx' }
      },
      {
        module: 'eversign',
        action: 'send',
        params: { documentId: '${step1.result.id}' }
      },
      {
        module: 'evertask',
        action: 'create',
        params: { title: 'Onboarding for TechCorp', assignee: 'team' }
      },
      {
        module: 'evercal',
        action: 'schedule',
        params: { title: 'Kickoff call', attendees: ['client'] }
      },
      {
        module: 'everbooks',
        action: 'createInvoice',
        params: { dealId: 'xxx', terms: 'net30' }
      }
    ];
    
    const results = [];
    for (const step of steps) {
      const module = this.modules.get(step.module);
      const result = await module[step.action](step.params, context);
      results.push(result);
    }
    
    return { success: true, results };
  }
}
```

## API Structure

```typescript
// app/api/trpc/[trpc]/route.ts
export const appRouter = router({
  // Entity operations
  entity: {
    create: protectedProcedure
      .input(z.object({
        type: z.string(),
        data: z.any()
      }))
      .mutation(async ({ input, ctx }) => {
        return await createEntity(input, ctx);
      }),
      
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
        types: z.array(z.string()).optional()
      }))
      .query(async ({ input, ctx }) => {
        return await searchEntities(input, ctx);
      })
  },
  
  // Command processing
  command: {
    execute: protectedProcedure
      .input(z.object({
        input: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        return await commandProcessor.process(input.input, ctx);
      })
  },
  
  // Module-specific endpoints
  evercore: {
    importSalesforce: protectedProcedure
      .input(z.object({
        credentials: z.object({
          instanceUrl: z.string(),
          accessToken: z.string()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        return await evercoreModule.importSalesforce(input.credentials, ctx);
      })
  }
});
```

## Deployment Configuration

```yaml
# vercel.json
{
  "functions": {
    "app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 60
    },
    "app/api/webhooks/stripe/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Environment Variables

```bash
# See previous env.example - using exact same configuration
```

## Security Considerations

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/pricing', '/api/webhooks(.*)'],
  
  afterAuth(auth, req) {
    // Require auth for all non-public routes
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    
    // Set company context for RLS
    if (auth.orgId) {
      req.headers.set('X-Company-ID', auth.orgId);
    }
  }
});
```

## Testing Strategy

```typescript
// tests/integration/cross-module.test.ts
describe('Cross-module orchestration', () => {
  it('should create task from email', async () => {
    // Create email entity
    const email = await createEntity({
      type: 'email',
      data: { subject: 'Follow up needed' }
    });
    
    // Execute command
    const result = await commandProcessor.process(
      `Create task from email ${email.id}`,
      testContext
    );
    
    // Verify task created with email reference
    expect(result.type).toBe('task');
    expect(result.data.sourceId).toBe(email.id);
  });
});
```

## Performance Optimization

```typescript
// Use materialized views for common queries
CREATE MATERIALIZED VIEW company_metrics AS
SELECT 
  company_id,
  COUNT(*) FILTER (WHERE type = 'contact') as total_contacts,
  COUNT(*) FILTER (WHERE type = 'deal') as total_deals,
  SUM((data->>'value')::numeric) FILTER (WHERE type = 'deal') as pipeline_value
FROM entities
GROUP BY company_id;

// Refresh periodically
CREATE OR REPLACE FUNCTION refresh_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY company_metrics;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring & Observability

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { PostHog } from 'posthog-node';

export function trackCommand(command: string, result: any, context: Context) {
  // Product analytics
  posthog.capture({
    distinctId: context.userId,
    event: 'command_executed',
    properties: {
      command_type: result.intent.action,
      modules_used: result.modules,
      execution_time: result.executionTime,
      success: result.success
    }
  });
  
  // Error tracking
  if (!result.success) {
    Sentry.captureException(new Error(`Command failed: ${command}`), {
      user: { id: context.userId },
      extra: { command, result }
    });
  }
}
```

## Scaling Considerations

```yaml
Phase 1 (0-100 customers):
  - Single Vercel deployment
  - Neon serverless PostgreSQL
  - Upstash Redis
  
Phase 2 (100-1000 customers):
  - Add read replicas
  - Implement caching layer
  - Add CDN for static assets
  
Phase 3 (1000+ customers):
  - Multi-region deployment
  - Dedicated PostgreSQL clusters
  - Redis cluster
  - Consider splitting API/Worker
```

## Adding New Modules

```typescript
// New module template
class EverNewModule implements Module {
  name = 'evernew';
  version = '1.0.0';
  entityTypes = ['new_type'];
  
  async onInstall(context: Context) {
    // Register with command processor
    commandProcessor.registerModule(this);
    
    // Add to module registry
    await db.insert(modules).values({
      name: this.name,
      version: this.version,
      companyId: context.companyId,
      enabled: true
    });
  }
}

// Register in main app
moduleRegistry.register(new EverNewModule());
```

This architecture supports infinite expansion while maintaining performance and simplicity. Each module is independent but can orchestrate with others through the unified data model and command processor.

# evergreenOS Platform Setup

## Current Status
- Landing page: Complete and deployed
- Platform: Ready to build on existing foundation

## Architecture Overview
- Single unified database (PostgreSQL with JSONB)
- Natural language command processing (OpenAI GPT-4)
- 10 initial modules sharing same data model
- Module extensibility for future additions

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @clerk/nextjs @neondatabase/serverless drizzle-orm @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query openai stripe @upstash/redis bullmq pusher pusher-js zod superjson
npm install -D drizzle-kit @types/node
2. Environment Variables
Create .env.local with:

DATABASE_URL (Neon PostgreSQL)
CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
Additional service keys as needed

3. File Structure
app/
├── (landing)/          # Existing landing pages
├── (platform)/         # New authenticated area
│   ├── dashboard/
│   ├── command/
│   └── [module]/
├── api/
│   ├── trpc/[trpc]/
│   └── webhooks/
lib/
├── db/                 # Database schema and client
├── ai/                 # Command processor
├── api/                # tRPC routers
└── modules/            # Module implementations
4. Core Components Needed

Database schema (unified entities table)
Authentication middleware (Clerk)
Command processor (OpenAI integration)
tRPC API setup
Module base class

5. Implementation Order

Set up database connection and schema
Add Clerk authentication
Create tRPC API structure
Build command processor
Implement first module (EverCore/CRM)
Add remaining modules incrementally

Development Guidelines

Keep landing page at '/' (public)
Platform at '/dashboard' (authenticated)
All modules share single entities table
Every feature accessible via natural language
Test with real users as you build

## Visual Development

### Design Principles
- Comprehensive design checklist in `/context/design-principles.md`
- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
   - **IMPORTANT**: Always save screenshots to `.screenshots/` directory
   - Example: `filename: ".screenshots/feature-name.png"`
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `@agent-design-review` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

## File Organization Guidelines

### Screenshots and Test Files
**IMPORTANT**: Keep the workspace clean and organized by following these rules:

1. **Screenshots Directory**: `.screenshots/`
   - ALL screenshots must be saved here
   - When using `mcp__playwright__browser_take_screenshot`, always use:
     ```
     filename: ".screenshots/[descriptive-name].png"
     ```
   - Example: `.screenshots/dashboard-with-auth.png`

2. **Test Scripts**: Save as `.screenshots/test-*.js`
3. **Capture Scripts**: Save as `.screenshots/capture-*.js`
4. **Never save screenshots in the project root directory**

This directory is gitignored to keep the repository clean.
