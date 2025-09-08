# Master Prompt to Fix EverMail UI Bugs

Fix these specific EverMail functionality issues:

## 1. Inbox Showing Sent Emails
**Problem**: Inbox displays both received AND sent emails. Should only show received.

**Fix**: Update the inbox query to exclude sent emails
- Check `/lib/api/routers/evermail.ts` - the `getEmails` query
- Add filter: `WHERE from != currentUserEmail` or similar
- Ensure only emails TO the user appear in inbox
- Sent emails should ONLY appear in Sent folder

## 2. Star/Unstar Not Working
**Problem**: Clicking star icon doesn't work or persist

**Fix**: 
- Add click handler to star icon
- Update email entity with `isStarred: true/false`
- Create tRPC mutation for toggling star status
- Starred emails should appear in Starred section
- Visual feedback when starring (filled vs outline icon)

## 3. Trash/Delete Not Working
**Problem**: Clicking trash icon doesn't delete or move to trash

**Fix**:
- Add click handler to trash icon
- Don't actually delete - mark as `status: 'trashed'`
- Move email to Trash folder view
- Add "Empty Trash" option that permanently deletes
- Exclude trashed emails from inbox/other views

## 4. Drafts Section Empty
**Problem**: Draft emails not showing in Drafts section

**Fix**:
- When email is partially composed, auto-save as draft
- Query drafts: `WHERE type = 'draft' OR isDraft = true`
- Show unsent/incomplete emails in Drafts section
- Make drafts clickable to resume editing

## 5. Save Draft Button Not Working
**Problem**: "Save Draft" button in compose doesn't save

**Fix**:
- Add click handler to Save Draft button
- Save current compose state to entities table
- Mark as `isDraft: true`
- Show confirmation toast "Draft saved"
- Allow retrieval from Drafts section

## 6. Rich Text Editor Buttons Broken
**Problem**: Bold, italic, attach, and other formatting buttons don't work

**Fix**:
- Check rich text editor initialization
- Ensure each button has proper command binding
- Common commands:
  - Bold: `editor.chain().focus().toggleBold().run()`
  - Italic: `editor.chain().focus().toggleItalic().run()`
  - Link: `editor.chain().focus().setLink({ href: url }).run()`
- For attachments: implement file upload handler
- Test ALL toolbar buttons

## 7. Input Field Losing Focus
**Problem**: Typing in To/Subject fields loses focus after each character

**Critical Fix**:
- This is likely a React re-render issue
- Check for state updates triggering full re-renders
- Solutions:
  - Use `useCallback` for handlers
  - Memoize components with `React.memo`
  - Check for key prop issues
  - Ensure form state is managed properly (controlled vs uncontrolled)
  - Move state closer to where it's needed

**Example fix pattern**:
```typescript
// BAD - causes re-render
const [to, setTo] = useState('');
<input value={to} onChange={(e) => setTo(e.target.value)} />

// GOOD - prevent unnecessary re-renders
const [to, setTo] = useState('');
const handleToChange = useCallback((e) => {
  setTo(e.target.value);
}, []);
<input value={to} onChange={handleToChange} />
```

## Files Likely Needing Changes

1. `/lib/api/routers/evermail.ts` - Query filters for inbox/starred/trash
2. `/components/evermail/EmailList.tsx` - Star/trash click handlers
3. `/components/evermail/Compose.tsx` - Input focus issue, save draft
4. `/app/(platform)/mail/inbox/page.tsx` - Inbox filtering
5. `/app/(platform)/mail/drafts/page.tsx` - Draft query
6. Rich text editor component - Toolbar button handlers

## Testing After Fixes

- [ ] Inbox shows ONLY received emails
- [ ] Sent folder shows ONLY sent emails  
- [ ] Star icon toggles and persists
- [ ] Starred emails appear in Starred section
- [ ] Trash icon moves email to Trash
- [ ] Drafts section shows saved drafts
- [ ] Save Draft button works with confirmation
- [ ] All rich text buttons function properly
- [ ] Can type continuously in To/Subject fields without losing focus
- [ ] No re-render issues while typing

The focus issue (#7) is the most critical UX problem - fix that first as it makes the app unusable.