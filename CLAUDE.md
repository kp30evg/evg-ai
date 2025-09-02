# evergreenOS - The Unified Business Operating System

## Mission
Build ONE system that replaces 50+ business tools by unifying all data in a single model, accessible through natural language. Not another integration platform - a true unified OS where every department's data lives together and understands each other.

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

## Architecture Foundation

### The Universal Data Model
```sql
-- This ONE table holds EVERYTHING - contacts, emails, tasks, invoices, messages, files
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  type VARCHAR(50), -- infinitely extensible: 'contact', 'email', 'task', 'invoice', etc.
  data JSONB,       -- flexible schema for any data structure
  relationships JSONB[], -- connections between entities
  metadata JSONB,   -- system metadata
  search_vector tsvector, -- full-text search
  embedding vector(1536), -- semantic search
  created_by UUID,
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
  
  // Core CRUD operations
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

## Build Plan - 10 Modules to MVP

### Phase 1: Core Infrastructure (Week 1)
**Goal**: Prove the architecture with foundation pieces

#### 1.1 Module Registry System
```typescript
// lib/modules/registry.ts
class ModuleRegistry {
  private modules = new Map<string, Module>()
  private commandRouter = new CommandRouter()
  
  register(module: Module) {
    this.modules.set(module.name, module)
    module.commands.forEach(cmd => 
      this.commandRouter.registerCommand(cmd, module)
    )
  }
  
  async handleCommand(input: string, context: Context) {
    const parsed = await this.parseCommand(input)
    const modules = this.commandRouter.getModulesForCommand(parsed)
    
    if (modules.length === 1) {
      return modules[0].executeCommand(parsed, context)
    }
    
    // Orchestrate across multiple modules
    return this.orchestrateCommand(parsed, modules, context)
  }
}
```

#### 1.2 Command Orchestrator
```typescript
// lib/ai/orchestrator.ts
class CommandOrchestrator {
  async orchestrateCommand(command: ParsedCommand, modules: Module[], context: Context) {
    // Example: "Show all emails about the Acme deal"
    // Requires: EverMail (emails) + EverCore (deal info)
    
    const plan = await this.createExecutionPlan(command, modules)
    const results = await this.executePlan(plan, context)
    return this.synthesizeResults(results)
  }
  
  private async createExecutionPlan(command: ParsedCommand, modules: Module[]) {
    // Use AI to determine execution order
    const prompt = `
      Command: ${command.text}
      Available modules: ${modules.map(m => m.name)}
      Create execution plan with dependencies
    `
    return await openai.createPlan(prompt)
  }
}
```

### Phase 2: First Three Modules (Week 1-2)
**Goal**: Implement core business data modules that prove cross-module queries work

#### Module 1: EverCore (CRM) - The Data Foundation
```typescript
// lib/modules/evercore/index.ts
export class EverCoreModule implements Module {
  name = 'evercore'
  entityTypes = ['contact', 'company', 'deal', 'activity']
  
  commands = [
    {
      pattern: /show deals closing this (month|quarter)/i,
      handler: this.getClosingDeals
    },
    {
      pattern: /why did we lose (.*)/i,
      handler: this.analyzeLostDeal  
    },
    {
      pattern: /create contact (.*) at (.*)/i,
      handler: this.createContact
    }
  ]
  
  async create(type: string, data: any, context: Context) {
    // Validate based on type
    const validated = this.validateData(type, data)
    
    // Create entity
    const entity = await db.insert(entities).values({
      company_id: context.companyId,
      type,
      data: validated,
      created_by: context.userId
    }).returning()
    
    // Auto-link relationships
    if (type === 'contact' && data.company_name) {
      const company = await this.findOrCreateCompany(data.company_name)
      await this.linkEntities(entity.id, company.id, 'works_at')
    }
    
    return entity
  }
  
  async analyzeLostDeal(command: ParsedCommand, context: Context) {
    const dealName = command.parameters.dealName
    
    // Get deal
    const deal = await this.search('deal', {name: dealName})
    
    // Get all related entities across ALL modules
    const relatedEmails = await moduleRegistry
      .getModule('evermail')
      .getRelatedEntities(deal.id, 'email')
    
    const relatedTasks = await moduleRegistry
      .getModule('evertask')
      .getRelatedEntities(deal.id, 'task')
    
    const relatedMeetings = await moduleRegistry
      .getModule('evercal')
      .getRelatedEntities(deal.id, 'event')
    
    // Analyze with AI
    return await this.aiAnalyze({
      deal,
      emails: relatedEmails,
      tasks: relatedTasks,
      meetings: relatedMeetings
    })
  }
}
```

#### Module 2: EverMail (Email) - Communication Hub
```typescript
// lib/modules/evermail/index.ts
export class EverMailModule implements Module {
  name = 'evermail'
  entityTypes = ['email', 'thread', 'attachment']
  
  commands = [
    {
      pattern: /show emails from (.*)/i,
      handler: this.getEmailsFrom
    },
    {
      pattern: /summarize email thread about (.*)/i,
      handler: this.summarizeThread
    }
  ]
  
  async importData(source: 'gmail', credentials: any) {
    const gmail = google.gmail({version: 'v1', auth: credentials})
    const messages = await gmail.users.messages.list({userId: 'me'})
    
    for (const message of messages.data.messages) {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      })
      
      // Create email entity
      const email = await this.create('email', {
        messageId: full.data.id,
        subject: this.extractHeader(full.data, 'Subject'),
        from: this.extractHeader(full.data, 'From'),
        to: this.extractHeader(full.data, 'To'),
        body: this.extractBody(full.data),
        timestamp: new Date(parseInt(full.data.internalDate))
      })
      
      // Auto-link to contacts
      const fromEmail = this.extractEmailAddress(email.data.from)
      const contact = await moduleRegistry
        .getModule('evercore')
        .search('contact', {email: fromEmail})
      
      if (contact) {
        await this.linkEntities(email.id, contact.id, 'sent_by')
      }
      
      // Extract and link mentioned deals
      const deals = await this.extractMentionedDeals(email.data.body)
      for (const deal of deals) {
        await this.linkEntities(email.id, deal.id, 'mentions')
      }
    }
  }
  
  async getRelatedEntities(entityId: string, targetType: 'email') {
    // Find all emails that mention this entity
    const results = await db.select().from(entities).where(
      and(
        eq(entities.type, 'email'),
        sql`data->>'body' LIKE '%${entityId}%' OR relationships @> '[{"id": "${entityId}"}]'`
      )
    )
    return results
  }
}
```

#### Module 3: EverTask (Tasks) - Action Engine
```typescript
// lib/modules/evertask/index.ts
export class EverTaskModule implements Module {
  name = 'evertask'
  entityTypes = ['task', 'project', 'milestone']
  
  commands = [
    {
      pattern: /create task from email (.*)/i,
      handler: this.createTaskFromEmail
    },
    {
      pattern: /what's blocking (.*)/i,
      handler: this.findBlockers
    },
    {
      pattern: /show my tasks/i,
      handler: this.getMyTasks
    }
  ]
  
  async createTaskFromEmail(command: ParsedCommand, context: Context) {
    const emailId = command.parameters.emailId
    
    // Get email from EverMail module
    const email = await moduleRegistry
      .getModule('evermail')
      .read(emailId, context)
    
    // Create task
    const task = await this.create('task', {
      title: `Follow up: ${email.data.subject}`,
      description: email.data.body,
      source: 'email',
      priority: this.analyzePriority(email.data.body),
      due_date: this.suggestDueDate(email.data.body)
    }, context)
    
    // Link to email
    await this.linkEntities(task.id, email.id, 'created_from')
    
    // Link to deal if mentioned
    if (email.relationships?.find(r => r.type === 'mentions_deal')) {
      const dealId = email.relationships.find(r => r.type === 'mentions_deal').id
      await this.linkEntities(task.id, dealId, 'related_to')
    }
    
    return task
  }
  
  async findBlockers(command: ParsedCommand, context: Context) {
    const projectName = command.parameters.project
    
    // Get project and all tasks
    const project = await this.search('project', {name: projectName})
    const tasks = await this.search('task', {project_id: project.id})
    
    // Find incomplete dependencies
    const blockers = tasks.filter(task => 
      task.data.status !== 'complete' && 
      task.data.blocks_tasks?.length > 0
    )
    
    // Get additional context from other modules
    for (const blocker of blockers) {
      // Check if waiting on email response
      const relatedEmails = await moduleRegistry
        .getModule('evermail')
        .getRelatedEntities(blocker.id, 'email')
      
      blocker.context = {
        last_email: relatedEmails[0]?.data.timestamp,
        assigned_to: blocker.data.assigned_to
      }
    }
    
    return blockers
  }
}
```

### Phase 3: Communication & Collaboration (Week 2)
**Goal**: Real-time communication that links to business data

#### Module 4: EverChat (Team Chat)
```typescript
// lib/modules/everchat/index.ts
export class EverChatModule implements Module {
  name = 'everchat'
  entityTypes = ['message', 'channel', 'thread']
  
  commands = [
    {
      pattern: /summarize #(.*) from (.*)/i,
      handler: this.summarizeChannel
    },
    {
      pattern: /find discussions about (.*)/i,
      handler: this.searchDiscussions
    }
  ]
  
  async create(type: 'message', data: any, context: Context) {
    const message = await super.create(type, data, context)
    
    // Real-time broadcast
    await pusher.trigger(
      `company-${context.companyId}-${data.channel}`,
      'new-message',
      message
    )
    
    // Auto-extract and link entities mentioned
    const mentioned = await this.extractMentions(data.text)
    for (const entity of mentioned) {
      await this.linkEntities(message.id, entity.id, 'mentions')
      
      // Create task if action item detected
      if (this.isActionItem(data.text)) {
        await moduleRegistry.getModule('evertask').create('task', {
          title: this.extractActionItem(data.text),
          source: 'chat',
          source_id: message.id
        }, context)
      }
    }
    
    return message
  }
  
  async importData(source: 'slack', credentials: any) {
    const slack = new WebClient(credentials.token)
    const channels = await slack.conversations.list()
    
    for (const channel of channels.channels) {
      // Create channel entity
      await this.create('channel', {
        slack_id: channel.id,
        name: channel.name,
        purpose: channel.purpose
      })
      
      // Import messages
      const messages = await slack.conversations.history({
        channel: channel.id
      })
      
      for (const msg of messages.messages) {
        await this.create('message', {
          channel: channel.name,
          user: msg.user,
          text: msg.text,
          timestamp: msg.ts,
          thread_ts: msg.thread_ts
        })
      }
    }
  }
}
```

#### Module 5: EverCal (Calendar)
```typescript
// lib/modules/evercal/index.ts
export class EverCalModule implements Module {
  name = 'evercal'
  entityTypes = ['event', 'availability', 'booking']
  
  commands = [
    {
      pattern: /schedule meeting with (.*) about (.*)/i,
      handler: this.scheduleMeeting
    },
    {
      pattern: /find time for (.*)/i,
      handler: this.findAvailableTime
    }
  ]
  
  async scheduleMeeting(command: ParsedCommand, context: Context) {
    const {contactName, topic} = command.parameters
    
    // Get contact from EverCore
    const contact = await moduleRegistry
      .getModule('evercore')
      .search('contact', {name: contactName})
    
    // Find mutual availability
    const slots = await this.findMutualAvailability(
      context.userId,
      contact.data.email
    )
    
    // Create event
    const event = await this.create('event', {
      title: `${topic} with ${contactName}`,
      attendees: [contact.data.email],
      suggested_times: slots,
      status: 'pending'
    }, context)
    
    // Link to contact and any related deal
    await this.linkEntities(event.id, contact.id, 'attendee')
    
    // Find related deal
    const deals = await moduleRegistry
      .getModule('evercore')
      .getRelatedEntities(contact.id, 'deal')
    
    if (deals.length > 0) {
      await this.linkEntities(event.id, deals[0].id, 'related_to')
    }
    
    // Send calendar invite
    await this.sendCalendarInvite(event)
    
    return event
  }
}
```

### Phase 4: Document & File Management (Week 3)
**Goal**: Unified document system that understands context

#### Module 6: EverDrive (Files)
```typescript
// lib/modules/everdrive/index.ts
export class EverDriveModule implements Module {
  name = 'everdrive'
  entityTypes = ['file', 'folder', 'share']
  
  commands = [
    {
      pattern: /find all files for (.*)/i,
      handler: this.findFilesForEntity
    },
    {
      pattern: /organize files by (project|client|date)/i,
      handler: this.autoOrganize
    }
  ]
  
  async create(type: 'file', data: any, context: Context) {
    // Store file in S3/R2
    const url = await this.uploadToStorage(data.content)
    
    const file = await super.create(type, {
      ...data,
      url,
      size: data.content.length,
      mime_type: data.mime_type
    }, context)
    
    // Auto-categorize and link
    const category = await this.aiCategorize(data.name, data.content)
    
    // Link to related entities
    if (category.type === 'contract') {
      const deal = await this.findRelatedDeal(data.content)
      if (deal) {
        await this.linkEntities(file.id, deal.id, 'contract_for')
      }
    }
    
    return file
  }
  
  async autoOrganize(command: ParsedCommand, context: Context) {
    const organizeBy = command.parameters.criteria
    const files = await this.search('file', {company_id: context.companyId})
    
    for (const file of files) {
      let folder
      
      if (organizeBy === 'client') {
        // Find related contact/company
        const related = await this.findRelatedEntity(file.id, 'contact')
        folder = related ? `Clients/${related.data.company}` : 'Uncategorized'
      } else if (organizeBy === 'project') {
        const related = await this.findRelatedEntity(file.id, 'project')
        folder = related ? `Projects/${related.data.name}` : 'Uncategorized'
      }
      
      await this.update(file.id, {folder}, context)
    }
  }
}
```

#### Module 7: EverDocs (Documents)
```typescript
// lib/modules/everdocs/index.ts
export class EverDocsModule implements Module {
  name = 'everdocs'
  entityTypes = ['document', 'template', 'version']
  
  commands = [
    {
      pattern: /create proposal for (.*)/i,
      handler: this.createProposal
    },
    {
      pattern: /update contract for (.*)/i,
      handler: this.updateContract
    }
  ]
  
  async createProposal(command: ParsedCommand, context: Context) {
    const dealName = command.parameters.deal
    
    // Get deal and related data
    const deal = await moduleRegistry
      .getModule('evercore')
      .search('deal', {name: dealName})
    
    const contact = await moduleRegistry
      .getModule('evercore')
      .read(deal.data.contact_id)
    
    // Get template
    const template = await this.search('template', {type: 'proposal'})
    
    // Generate document with AI
    const content = await this.generateFromTemplate(template, {
      deal,
      contact,
      company: context.company
    })
    
    // Create document
    const doc = await this.create('document', {
      title: `Proposal - ${deal.data.name}`,
      content,
      type: 'proposal',
      status: 'draft'
    }, context)
    
    // Link to deal
    await this.linkEntities(doc.id, deal.id, 'proposal_for')
    
    // Store in EverDrive
    await moduleRegistry.getModule('everdrive').create('file', {
      name: `${doc.data.title}.pdf`,
      content: await this.exportToPDF(content),
      source_entity: doc.id
    }, context)
    
    return doc
  }
}
```

#### Module 8: EverSign (E-Signatures)
```typescript
// lib/modules/eversign/index.ts
export class EverSignModule implements Module {
  name = 'eversign'
  entityTypes = ['envelope', 'signature', 'audit_trail']
  
  commands = [
    {
      pattern: /send (.*) for signature/i,
      handler: this.sendForSignature
    },
    {
      pattern: /check signature status for (.*)/i,
      handler: this.checkStatus
    }
  ]
  
  async sendForSignature(command: ParsedCommand, context: Context) {
    const docName = command.parameters.document
    
    // Get document
    const doc = await moduleRegistry
      .getModule('everdocs')
      .search('document', {title: docName})
    
    // Get related deal and contact
    const deal = await this.findRelatedEntity(doc.id, 'deal')
    const contact = await moduleRegistry
      .getModule('evercore')
      .read(deal.data.contact_id)
    
    // Create envelope
    const envelope = await this.create('envelope', {
      document_id: doc.id,
      signers: [{
        email: contact.data.email,
        name: contact.data.name,
        role: 'customer'
      }],
      status: 'sent'
    }, context)
    
    // Send via DocuSign/HelloSign API
    await this.sendViaProvider(envelope)
    
    // Create task for follow-up
    await moduleRegistry.getModule('evertask').create('task', {
      title: `Follow up on signature: ${doc.data.title}`,
      due_date: this.addDays(new Date(), 3),
      related_to: envelope.id
    }, context)
    
    return envelope
  }
}
```

### Phase 5: Analytics & Finance (Week 3-4)
**Goal**: Intelligence layer that sees across all modules

#### Module 9: EverSight (Analytics)
```typescript
// lib/modules/eversight/index.ts
export class EverSightModule implements Module {
  name = 'eversight'
  entityTypes = ['report', 'dashboard', 'metric', 'insight']
  
  commands = [
    {
      pattern: /analyze (.*) performance/i,
      handler: this.analyzePerformance
    },
    {
      pattern: /why are we (losing|winning) deals/i,
      handler: this.analyzeDealPatterns
    },
    {
      pattern: /predict revenue for (.*)/i,
      handler: this.predictRevenue
    }
  ]
  
  async analyzeDealPatterns(command: ParsedCommand, context: Context) {
    const outcome = command.parameters.outcome // 'losing' or 'winning'
    
    // Get all deals with outcome
    const deals = await moduleRegistry
      .getModule('evercore')
      .search('deal', {status: outcome === 'losing' ? 'lost' : 'won'})
    
    // For each deal, gather ALL related data
    const enrichedDeals = await Promise.all(deals.map(async (deal) => {
      const emails = await moduleRegistry
        .getModule('evermail')
        .getRelatedEntities(deal.id, 'email')
      
      const meetings = await moduleRegistry
        .getModule('evercal')
        .getRelatedEntities(deal.id, 'event')
      
      const tasks = await moduleRegistry
        .getModule('evertask')
        .getRelatedEntities(deal.id, 'task')
      
      const messages = await moduleRegistry
        .getModule('everchat')
        .searchDiscussions(deal.data.name)
      
      const documents = await moduleRegistry
        .getModule('everdocs')
        .getRelatedEntities(deal.id, 'document')
      
      return {
        deal,
        email_count: emails.length,
        meeting_count: meetings.length,
        response_time: this.calculateAvgResponseTime(emails),
        task_completion_rate: this.calculateTaskCompletion(tasks),
        proposal_sent: documents.some(d => d.data.type === 'proposal'),
        last_contact: this.findLastContact(emails, meetings, messages),
        deal_duration: this.calculateDealDuration(deal),
        touches_before_close: emails.length + meetings.length + messages.length
      }
    }))
    
    // Analyze patterns with AI
    const patterns = await openai.analyze({
      prompt: `Find patterns in ${outcome} deals`,
      data: enrichedDeals
    })
    
    // Create insight
    const insight = await this.create('insight', {
      title: `Why we're ${outcome} deals`,
      patterns: patterns.key_factors,
      recommendations: patterns.recommendations,
      confidence: patterns.confidence,
      supporting_data: enrichedDeals
    }, context)
    
    return insight
  }
  
  async predictRevenue(command: ParsedCommand, context: Context) {
    const period = command.parameters.period
    
    // Get historical data
    const historicalDeals = await moduleRegistry
      .getModule('evercore')
      .search('deal', {status: 'won'})
    
    const historicalInvoices = await moduleRegistry
      .getModule('everbooks')
      .search('invoice', {status: 'paid'})
    
    // Get current pipeline
    const pipeline = await moduleRegistry
      .getModule('evercore')
      .search('deal', {status: 'open'})
    
    // Analyze velocity and patterns
    const velocity = this.calculateSalesVelocity(historicalDeals)
    const winRate = this.calculateWinRate(historicalDeals)
    const avgDealSize = this.calculateAvgDealSize(historicalDeals)
    
    // ML prediction
    const prediction = await this.mlPredict({
      historical: historicalDeals,
      pipeline,
      velocity,
      winRate,
      avgDealSize,
      period
    })
    
    return {
      predicted_revenue: prediction.amount,
      confidence: prediction.confidence,
      factors: prediction.factors,
      risks: prediction.risks
    }
  }
}
```

#### Module 10: EverBooks (Light Finance)
```typescript
// lib/modules/everbooks/index.ts
export class EverBooksModule implements Module {
  name = 'everbooks'
  entityTypes = ['invoice', 'payment', 'expense']
  
  commands = [
    {
      pattern: /create invoice for (.*)/i,
      handler: this.createInvoice
    },
    {
      pattern: /show overdue invoices/i,
      handler: this.getOverdueInvoices
    },
    {
      pattern: /calculate burn rate/i,
      handler: this.calculateBurnRate
    }
  ]
  
  async createInvoice(command: ParsedCommand, context: Context) {
    const dealName = command.parameters.deal
    
    // Get deal from EverCore
    const deal = await moduleRegistry
      .getModule('evercore')
      .search('deal', {name: dealName})
    
    // Create invoice
    const invoice = await this.create('invoice', {
      deal_id: deal.id,
      customer_id: deal.data.company_id,
      amount: deal.data.value,
      due_date: this.addDays(new Date(), 30),
      status: 'draft',
      line_items: this.generateLineItems(deal)
    }, context)
    
    // Link to deal
    await this.linkEntities(invoice.id, deal.id, 'invoice_for')
    
    // Create task for follow-up
    await moduleRegistry.getModule('evertask').create('task', {
      title: `Follow up on invoice #${invoice.data.number}`,
      due_date: invoice.data.due_date,
      related_to: invoice.id
    }, context)
    
    return invoice
  }
  
  async calculateBurnRate(command: ParsedCommand, context: Context) {
    // Get all expenses from last 3 months
    const expenses = await this.search('expense', {
      date_gte: this.monthsAgo(3)
    })
    
    // Get all revenue
    const payments = await this.search('payment', {
      date_gte: this.monthsAgo(3)
    })
    
    // Calculate monthly burn
    const monthlyExpenses = this.groupByMonth(expenses)
    const monthlyRevenue = this.groupByMonth(payments)
    
    const burnRate = monthlyExpenses.map((month, index) => ({
      month: month.month,
      expenses: month.total,
      revenue: monthlyRevenue[index]?.total || 0,
      net_burn: month.total - (monthlyRevenue[index]?.total || 0)
    }))
    
    // Get runway
    const currentCash = await this.getCurrentCash(context)
    const avgBurn = burnRate.reduce((sum, m) => sum + m.net_burn, 0) / burnRate.length
    const runway = currentCash / avgBurn
    
    return {
      burn_rate: burnRate,
      average_monthly_burn: avgBurn,
      current_cash: currentCash,
      runway_months: runway
    }
  }
}
```

## Command Routing & Orchestration

### Natural Language Processing Pipeline
```typescript
// lib/ai/command-processor.ts
class CommandProcessor {
  async process(input: string, context: Context) {
    // 1. Parse intent and extract entities
    const parsed = await this.parseWithAI(input)
    
    // 2. Identify required modules
    const modules = this.identifyModules(parsed)
    
    // 3. Create execution plan
    const plan = await this.createPlan(parsed, modules)
    
    // 4. Execute plan (can be multi-module)
    const results = await this.executePlan(plan, context)
    
    // 5. Synthesize response
    return await this.synthesizeResponse(results)
  }
  
  private async parseWithAI(input: string) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `Parse business command and extract:
          - intent (what they want to do)
          - entities (people, companies, deals mentioned)
          - time_frame (when)
          - filters (any conditions)
        `
      }, {
        role: 'user',
        content: input
      }],
      functions: [{
        name: 'parse_command',
        parameters: {
          type: 'object',
          properties: {
            intent: {type: 'string'},
            entities: {type: 'array', items: {type: 'object'}},
            time_frame: {type: 'string'},
            filters: {type: 'object'}
          }
        }
      }]
    })
    
    return JSON.parse(response.choices[0].function_call.arguments)
  }
  
  private async executePlan(plan: ExecutionPlan, context: Context) {
    const results = []
    
    for (const step of plan.steps) {
      if (step.dependencies) {
        // Wait for dependencies
        await Promise.all(
          step.dependencies.map(dep => 
            results.find(r => r.id === dep)?.promise
          )
        )
      }
      
      const module = moduleRegistry.getModule(step.module)
      const result = await module.executeCommand(step.command, context)
      results.push({id: step.id, result})
    }
    
    return results
  }
}
```

### Cross-Module Query Examples
```typescript
// Example 1: "Why did we lose the Acme deal?"
// Touches: EverCore (deal) + EverMail (emails) + EverCal (meetings) + EverChat (discussions) + EverTask (tasks)

async function analyzeLostDeal(dealName: string) {
  // Get the deal
  const deal = await evercore.search('deal', {name: dealName, status: 'lost'})
  
  // Get all related data
  const emails = await evermail.getRelatedEntities(deal.id, 'email')
  const meetings = await evercal.getRelatedEntities(deal.id, 'event')
  const messages = await everchat.searchDiscussions(dealName)
  const tasks = await evertask.getRelatedEntities(deal.id, 'task')
  const documents = await everdocs.getRelatedEntities(deal.id, 'document')
  
  // Analyze timeline
  const timeline = [
    ...emails.map(e => ({time: e.created_at, type: 'email', data: e})),
    ...meetings.map(m => ({time: m.created_at, type: 'meeting', data: m})),
    ...messages.map(m => ({time: m.created_at, type: 'message', data: m})),
    ...tasks.map(t => ({time: t.created_at, type: 'task', data: t}))
  ].sort((a, b) => a.time - b.time)
  
  // Find patterns
  const lastContact = timeline[timeline.length - 1]
  const responseTime = calculateAvgResponseTime(emails)
  const meetingNoShows = meetings.filter(m => m.data.status === 'no_show')
  const incompleteTasks = tasks.filter(t => t.data.status !== 'complete')
  
  return {
    deal,
    last_activity: lastContact,
    avg_response_time: responseTime,
    meeting_no_shows: meetingNoShows.length,
    incomplete_tasks: incompleteTasks.length,
    proposal_sent: documents.some(d => d.data.type === 'proposal'),
    ai_analysis: await analyzeWithAI(timeline)
  }
}

// Example 2: "Schedule a meeting with everyone involved in the TechCorp deal"
// Touches: EverCore (deal, contacts) + EverCal (scheduling) + EverMail (invites)

async function scheduleTeamMeeting(dealName: string) {
  // Get deal and all involved contacts
  const deal = await evercore.search('deal', {name: dealName})
  const contacts = await evercore.getRelatedEntities(deal.id, 'contact')
  
  // Get everyone's availability
  const availability = await Promise.all(
    contacts.map(c => evercal.getAvailability(c.data.email))
  )
  
  // Find common slot
  const commonSlots = findCommonAvailability(availability)
  
  // Create meeting
  const meeting = await evercal.create('event', {
    title: `${dealName} Team Sync`,
    attendees: contacts.map(c => c.data.email),
    time: commonSlots[0],
    deal_id: deal.id
  })
  
  // Send invites
  await evermail.sendCalendarInvite(meeting)
  
  // Create prep task
  await evertask.create('task', {
    title: `Prepare agenda for ${dealName} meeting`,
    due_date: meeting.data.time,
    assigned_to: deal.data.owner_id
  })
  
  return meeting
}
```

## Testing & Validation

### Module Testing Framework
```typescript
// tests/modules/test-module.ts
describe('Module Integration Tests', () => {
  it('should handle cross-module queries', async () => {
    // Create test data
    const contact = await evercore.create('contact', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    
    const deal = await evercore.create('deal', {
      name: 'Test Deal',
      contact_id: contact.id,
      value: 10000
    })
    
    const email = await evermail.create('email', {
      from: 'john@example.com',
      subject: 'About Test Deal',
      body: 'Interested in moving forward'
    })
    
    // Link entities
    await evermail.linkEntities(email.id, deal.id, 'mentions')
    
    // Test cross-module query
    const result = await commandProcessor.process(
      'Show all communications about Test Deal',
      testContext
    )
    
    expect(result.emails).toHaveLength(1)
    expect(result.emails[0].id).toBe(email.id)
  })
  
  it('should orchestrate multi-module commands', async () => {
    const result = await commandProcessor.process(
      'Create a task from the last email about Test Deal',
      testContext
    )
    
    expect(result.task).toBeDefined()
    expect(result.task.data.source).toBe('email')
    expect(result.task.relationships).toContainEqual({
      id: email.id,
      type: 'created_from'
    })
  })
})
```

### Performance Benchmarks
```typescript
// Each module must meet these criteria:
const performanceRequirements = {
  create: 100,     // ms - max time to create entity
  search: 500,     // ms - max time for search
  command: 2000,   // ms - max time for command execution
  import: 60000,   // ms - max time per 1000 records
}

// Test query performance at scale
describe('Performance Tests', () => {
  it('should handle 1M entities efficiently', async () => {
    // Seed 1M entities
    await seedDatabase(1000000)
    
    const start = Date.now()
    const results = await evercore.search('contact', {
      company: 'Acme Corp'
    })
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(500)
  })
})
```

## Deployment & Scaling

### Infrastructure Requirements
```yaml
Production:
  Database:
    - Neon PostgreSQL with autoscaling
    - pgvector extension for semantic search
    - Read replicas for analytics
  
  Caching:
    - Redis for command results (Upstash)
    - Edge caching for common queries
  
  Compute:
    - Vercel Functions for API
    - Background jobs via Inngest/QStash
  
  Storage:
    - Cloudflare R2 for files
    - Vectors in Pinecone (optional)
  
  Realtime:
    - Pusher for chat/presence
    - Webhooks for integrations
```

### Monitoring & Observability
```typescript
// Track every command for learning
interface CommandMetrics {
  command: string
  modules_used: string[]
  execution_time: number
  entities_touched: number
  success: boolean
  user_satisfaction: number // from feedback
}

// Use patterns to improve routing
class CommandLearning {
  async improve() {
    const patterns = await db.query(`
      SELECT command, modules_used, COUNT(*) as frequency
      FROM command_history
      WHERE success = true
      GROUP BY command, modules_used
      ORDER BY frequency DESC
    `)
    
    // Create shortcuts for common patterns
    patterns.forEach(pattern => {
      this.createShortcut(pattern.command, pattern.modules_used)
    })
  }
}
```

## Success Criteria

### MVP Launch Checklist
- [ ] All 10 modules implement Module interface
- [ ] Cross-module queries work (test 20 scenarios)
- [ ] Natural language handles 80% of commands
- [ ] Import works for Gmail, Slack, Salesforce
- [ ] Real-time updates via Pusher
- [ ] 90th percentile response time < 2s
- [ ] Can handle 10,000 entities per company
- [ ] Command success rate > 70%

### Business Validation
- [ ] One command can touch 3+ modules
- [ ] "Why did we lose X?" returns insights
- [ ] "Schedule meeting about Y" handles availability
- [ ] "Create invoice for Z" links to deal
- [ ] "Show everything about Customer" aggregates all data

### Technical Validation
- [ ] Adding new module requires < 1 hour
- [ ] New entity types require no schema changes
- [ ] Commands route correctly 90% of time
- [ ] System handles 100 concurrent users
- [ ] Data consistency across modules

## The Vision Realized

When complete, evergreenOS will enable commands like:

```
"Why are deals with technical founders closing faster?"
→ Analyzes all deals, emails, meeting notes, chat messages
→ Finds patterns in communication style, proposal types, meeting frequency
→ Returns actionable insights

"Set up everything for our new customer Acme Corp"
→ Creates company and contacts in CRM
→ Sets up Slack channel
→ Creates project in task manager
→ Schedules onboarding call
→ Generates invoice
→ Creates shared folder
→ Sends welcome email
→ All in one command, across all modules

"Show me what changed since yesterday"
→ Aggregates all new emails, messages, tasks, deal updates
→ Prioritizes by importance
→ Suggests actions to take
→ One view of entire business
```

This is not just another SaaS tool. This is the operating system for business - where all data lives in harmony and speaks the same language.