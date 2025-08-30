# evergreenOS Development Plan

## Project Overview
Building a unified business operating system that replaces 50+ tools with natural language control.

## Current Status
✅ Landing page complete and working
⏳ Platform development starting

## Implementation Phases

### Phase 1: Core Infrastructure (Current)
- [ ] Database setup (Neon + Drizzle)
- [ ] Authentication (Clerk)
- [ ] API layer (tRPC)
- [ ] Command processor (OpenAI)

### Phase 2: First Module (Week 1)
- [ ] EverCore (CRM) - contacts, deals, pipeline
- [ ] Basic CRUD operations
- [ ] Natural language commands
- [ ] Import from Salesforce

### Phase 3: Communication Modules (Week 2)
- [ ] EverMail - Gmail integration
- [ ] EverChat - Slack import
- [ ] Cross-module linking

### Phase 4: Workflow Modules (Week 3)
- [ ] EverTask - Task management
- [ ] EverCal - Calendar sync
- [ ] Task creation from emails/chats

### Phase 5: Intelligence Layer (Week 4)
- [ ] EverSight - Analytics
- [ ] Cross-module queries
- [ ] Pattern detection
- [ ] Command learning

### Phase 6: Polish & Launch (Week 5)
- [ ] Import tools
- [ ] Onboarding flow
- [ ] Error handling
- [ ] Performance optimization

## Success Metrics
- [ ] 10 modules sharing data
- [ ] Natural language works 80%+ accuracy
- [ ] Cross-module orchestration working
- [ ] Sub-3 second response times
- [ ] 48-hour migration from competitors

## Technical Decisions
- ✅ Single unified database (not microservices)
- ✅ Natural language first (not GUI first)
- ✅ Module extensibility (future-proof)
- ✅ Multi-tenant from day 1

## Immediate Next Steps (Execute Now)

### Step 1: Initialize Project Structure
```bash
# Create all required directories
mkdir -p app/\(platform\)/{dashboard,command}
mkdir -p app/api/trpc/\[trpc\]
mkdir -p lib/{db,ai,api,modules}
mkdir -p drizzle
Step 2: Set Up Database

Create Neon account at neon.tech
Create new database
Copy connection string to .env.local
Run: npm run db:push

Step 3: Configure Clerk

Go to clerk.com
Create new application
Copy keys to .env.local
Enable organizations in Clerk dashboard

Step 4: Get OpenAI Key

Go to platform.openai.com
Create API key
Add to .env.local

Step 5: Create Core Files
Run the setup script or manually create these 10 files:

lib/db/schema.ts
lib/db/index.ts
drizzle.config.ts
middleware.ts
lib/api/trpc.ts
lib/api/root.ts
app/api/trpc/[trpc]/route.ts
lib/ai/command-processor.ts
app/(platform)/layout.tsx
app/providers.tsx

Step 6: Test Foundation
bashnpm run dev
# Visit localhost:3000 - landing page should work
# Visit localhost:3000/dashboard - should require auth
Step 7: Create First Entity
Test the system by creating a contact through the API
Step 8: Test Command Processing
Try: "Show me all contacts" through the command interface