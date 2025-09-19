# EverTask Fixes - changes.md

## Critical Issues to Fix

### 1. Add Task Button Not Working
**File**: `/app/(platform)/dashboard/tasks/[projectId]/page.tsx` or similar
- Check onClick handler for "Add Task" button
- Ensure it's calling the correct tRPC mutation
- Verify the mutation actually creates task entity in database

### 2. Add Column Button Not Working
**File**: Component handling the column display
- The "Add Column" button needs click handler
- Should open column selector or add new column to view
- Update state to include new column in table

### 3. Status Groups (To Do, In Progress, Completed) - Can't Add Tasks
**File**: Task list/board component
- Each status group needs working "Add task" button
- Should create task with that status pre-selected
- Check the onClick handlers for each group's add button

### 4. Date Picker Not Working
**File**: Task form or inline editor
- Date input needs proper date picker component
- Check if date library is installed and imported
- Ensure date changes save to database

### 5. Filter and Group By Not Working
**File**: Task list header component
- Filter dropdown needs functional options
- Group By needs to reorganize task display
- Both need state management and query updates

### 6. Task Row Actions Not Working
**File**: Task row component
- Three dots menu needs click handler
- Should show options: Edit, Delete, Duplicate, etc.
- Each action needs implementation

## Quick Fix Checklist

```markdown
## Verify with Playwright MCP:

1. [ ] Click "Add Task" button - should open form or create task
2. [ ] Click "Add task" under each status group - should create task with that status
3. [ ] Click "Add Column" - should show column options
4. [ ] Click date field - should open date picker
5. [ ] Select date - should save to task
6. [ ] Click Filter - should show filter options
7. [ ] Apply filter - should update task list
8. [ ] Click Group by - should show grouping options
9. [ ] Select grouping - should reorganize display
10. [ ] Click three dots on task - should show action menu
11. [ ] Click assignee field - should show user list
12. [ ] Change priority - should update and save
```

## Common Issues to Check

1. **Missing tRPC mutations** - Ensure all CRUD operations exist in `/lib/api/routers/tasks.ts`
2. **Missing click handlers** - Every button needs onClick function
3. **State not updating** - Check if using proper React state management
4. **Database not saving** - Verify mutations actually write to entities table
5. **Missing imports** - Check all components are properly imported

## Implementation Pattern

For each broken button, follow this pattern:

```typescript
// Check the button has handler
<button onClick={handleAddTask}>Add Task</button>

// Handler should exist
const handleAddTask = () => {
  // Open modal or create task
  createTask.mutate({ 
    title: "New Task",
    status: "todo",
    projectId 
  });
};

// tRPC mutation should exist
const createTask = trpc.tasks.create.useMutation({
  onSuccess: () => {
    // Refresh task list
    refetch();
  }
});
```

## Testing with Playwright MCP

Tell Playwright MCP to:
1. Navigate to `/dashboard/tasks/[projectId]`
2. Try clicking each button mentioned above
3. Verify if action occurs
4. Report which specific handlers are missing

The core issue is likely that the UI was built but the click handlers and mutations weren't connected. Each interactive element needs both a frontend handler and a backend mutation to work.