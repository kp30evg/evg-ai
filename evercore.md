# EverCore CRM Build Instructions - Production-Ready with Full Customization

## Core Architecture
Build EverCore with two layers:

- **Smart defaults** that work instantly (auto-populated contacts from email/calendar)  
- **Full customization layer** like HubSpot/Salesforce (custom fields, pipelines, views)  

> The key: It works perfectly out-of-the-box **but** can be customized to match any business process.

---

## Phase 1: Foundation with Smart Defaults

### Basic Entity Structure
Create person and company entities that auto-populate from emails and calendar events. Standard fields:

- **People:** name, email, phone, title, company, last contacted  
- **Companies:** name, domain, size, industry  

### Auto-Population Engine
Scan all existing emails and calendar events to:  

- Create person records for every email address found  
- Extract names, phones, titles from signatures  
- Link all communications to the right people  
- Calculate engagement scores automatically  

✅ Must work with **zero configuration** — just connects and populates.

---

## Phase 2: Customization System

### Custom Fields
Allow users to add fields to any entity type through UI or natural language:

- **Field types:** text, number, date, dropdown, multi-select, checkbox, formula, lookup  
- Add via command: `"Add a field for deal size to contacts"`  
- Or through UI with standard field creation form  
- Fields appear immediately in all views  

### Custom Objects
Beyond people/companies, users can create **any object type**:

- Deals with custom stages  
- Projects with milestones  
- Tickets with priorities  
- Other: Properties, Invoices, Shipments, etc.  

Store in `entities` table with:  
`type = 'custom:[object_name]'`

---

## Phase 3: Pipeline Builder

### Visual Pipeline Editor
- Drag-and-drop interface  
- Multiple pipelines (Sales, Onboarding, Hiring)  
- Set probability & value per stage  
- Automations between stages  
- Color coding + icons  

### Default Pipelines
Ship with modifiable defaults:

- **Sales:** Lead → Qualified → Demo → Negotiation → Closed  
- **Support:** New → Triaging → In Progress → Resolved  
- **Hiring:** Applied → Screened → Interviewed → Offer → Hired  

---

## Phase 4: Views and Layouts

### View Types
- Table view  
- Kanban boards  
- Calendar view  
- Timeline view  
- Map view (if addresses present)  

### Customizable Layouts
- Drag & reorder fields  
- Create sections/tabs  
- Conditional visibility  
- Different layouts per team  
- Save templates  

### Saved Views
Examples:  

- "My Hot Leads"  
- "Customers needing renewal"  
- "Deals closing this month"  

---

## Phase 5: Automation Engine

### Visual Workflow Builder
- **When [trigger] then [action]**  
- Triggers: field change, time-based, email received, form submitted  
- Actions: update field, send email, create task, notify user, call webhook  

### Pre-Built Automations
- "When deal hits Closed Won → create onboarding project"  
- "When no contact for 30 days → set status to Cold"  
- "When VIP email received → alert account owner"  

### Natural Language Automation
- "When someone books a meeting, create a prep task 1 day before"  
- "If deal stuck in negotiation 2 weeks, alert manager"  

---

## Phase 6: Reporting and Analytics

### Custom Dashboards
- Drag-and-drop widgets  
- Charts: line, bar, pie, funnel  
- Metrics: count, sum, average  
- Global filters  
- Schedule email reports  

### Standard Reports
- Pipeline velocity  
- Activity leaderboard  
- Conversion rates by source  
- Team performance  

### Natural Language Analytics
- "Show me conversion rate by lead source"  
- "Which rep has highest close rate?"  
- "Forecast next quarter based on pipeline"  

---

## Phase 7: Advanced Features

- **Calculated Fields:** formulas like `daysSinceLastContact` or `dealValue * probability`  
- **Relationship Mapping:** org charts, influence networks  
- **Territory Management:** assignment by geography, round-robin, capacity rules  

---

## Phase 8: Natural Language Control

### Data Commands
- "Show me all deals over 50k closing this month"  
- "Who are my champions at Acme Corp?"  

### Customization Commands
- "Add a competitor field to opportunities"  
- "Create a pipeline for partner onboarding"  

### Action Commands
- "Move the Acme deal to negotiation"  
- "Schedule follow-ups with everyone I met this week"  
- "Assign all California leads to Sarah"  

---

## Implementation Strategy

### Database Design
- **Entities table (existing):** all records stored with JSONB  
  - `type` field: person, company, deal, custom:*  
- **New tables:**  
  - `field_definitions` → custom field configs  
  - `pipeline_stages` → pipeline configs  
  - `view_configs` → saved views  
  - `automation_rules` → workflows  
  - `layout_configs` → UI customizations  

### Smart Defaults
- Works immediately with no setup  
- Suggests customizations based on usage  
- Learns from behavior  

### Progressive Disclosure
- Start simple (people, companies)  
- Reveal customizations as needed  
- Natural language guides discovery  

---

## Integration with EvergreenOS Modules

### Current State
- Entities table already has: emails + calendar events  
- EverMail syncing Gmail  
- EverCal syncing Google Calendar  
- EverChat handling chat commands  

### Critical Integration Points
EverCore must:  
- Use `entities` table (no separate contacts table)  
- Link via `relationships` JSONB array  
- Extract people from existing emails/calendar  
- Extend existing natural language command system  
- Maintain single data model  

---

## Database Relationships
- Preserve existing mail/calendar links  
- Add bidirectional links between people & emails  

---

## File Structure
- `/app/(platform)/dashboard/crm/` → CRM views  
- `/components/evercore/` → components  
- `/lib/services/evercore/` → services  
- `/app/api/crm/` → API endpoints  

---

## Natural Language Integration
- Use existing chat interface  
- Route CRM commands through processor  
- Return results to chat UI  

---

## UI/UX Consistency
- Add CRM icon to sidebar  
- Keep style consistent  
- Use shared UI components  

---

## Data Flow
1. Email arrives → EverMail creates entity  
2. EverCore detects entity → creates/updates person  
3. Links both ways  
4. Chat commands now work instantly  

---

## Custom Fields Storage
- Standard fields → `data.email`, `data.firstName`  
- Custom fields → `data.customFields.dealSize`  

---

## Pipeline Storage
- `pipeline_stages` = configuration  
- Deals = entities with stage + pipelineId  

---

## Migration Safety
- Never delete existing entities  
- Only add new relationships/entities  
- Preserve mail/calendar functionality  

---

✅ This ensures EverCore **enhances** the system without breaking what already works.