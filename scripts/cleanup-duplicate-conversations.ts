import 'dotenv/config';
import { db } from '../lib/db';
import { entities, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function cleanupDuplicateConversations() {
  console.log('🧹 Cleaning up duplicate DM conversations...\n');
  
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces)
    .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
    .limit(1);
  
  if (!workspace) {
    console.error('❌ Evergreen workspace not found!');
    process.exit(1);
  }
  
  // Get all conversations
  const conversations = await db.select().from(entities)
    .where(and(
      eq(entities.workspaceId, workspace.id),
      eq(entities.type, 'conversation')
    ));
  
  console.log('Found', conversations.length, 'total conversations');
  
  // Find duplicate DM conversations
  const dmConversations = conversations.filter((conv: any) => 
    conv.data?.title?.startsWith('DM:')
  );
  
  console.log('Found', dmConversations.length, 'DM conversations');
  
  // Group by participants to find duplicates
  const conversationsByParticipants = new Map<string, any[]>();
  
  dmConversations.forEach((conv: any) => {
    const participants = conv.data?.participants || [];
    if (participants.length === 2) {
      // Sort participants for consistent key
      const key = [...participants].sort().join('|');
      const existing = conversationsByParticipants.get(key) || [];
      existing.push(conv);
      conversationsByParticipants.set(key, existing);
    }
  });
  
  // Find and remove duplicates
  let duplicatesRemoved = 0;
  for (const [key, convs] of conversationsByParticipants) {
    if (convs.length > 1) {
      console.log(`\n⚠️  Found ${convs.length} conversations between users: ${key}`);
      
      // Sort by creation date, keep the oldest
      convs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const keeper = convs[0];
      console.log(`  ✅ Keeping: ${keeper.data.title} (ID: ${keeper.id.substring(0, 8)}..., created: ${new Date(keeper.createdAt).toLocaleString()})`);
      
      // Get messages from duplicate conversations
      for (let i = 1; i < convs.length; i++) {
        const duplicate = convs[i];
        console.log(`  ❌ Removing: ${duplicate.data.title} (ID: ${duplicate.id.substring(0, 8)}..., created: ${new Date(duplicate.createdAt).toLocaleString()})`);
        
        // Move messages from duplicate to keeper
        const messages = await db.select().from(entities)
          .where(and(
            eq(entities.workspaceId, workspace.id),
            eq(entities.type, 'message')
          ));
        
        const messagesToMove = messages.filter((msg: any) => 
          msg.relationships?.conversation === duplicate.id
        );
        
        if (messagesToMove.length > 0) {
          console.log(`     Moving ${messagesToMove.length} messages to keeper conversation`);
          for (const msg of messagesToMove) {
            await db.update(entities)
              .set({
                relationships: { ...msg.relationships, conversation: keeper.id }
              })
              .where(eq(entities.id, msg.id));
          }
        }
        
        // Delete the duplicate conversation
        await db.delete(entities).where(eq(entities.id, duplicate.id));
        duplicatesRemoved++;
      }
    }
  }
  
  console.log(`\n✅ Cleanup complete! Removed ${duplicatesRemoved} duplicate conversations`);
  
  // Show remaining conversations
  const remainingConvs = await db.select().from(entities)
    .where(and(
      eq(entities.workspaceId, workspace.id),
      eq(entities.type, 'conversation')
    ));
  
  const remainingDMs = remainingConvs.filter((conv: any) => 
    conv.data?.title?.startsWith('DM:')
  );
  
  console.log('\n📊 Final state:');
  console.log('  - Total conversations:', remainingConvs.length);
  console.log('  - DM conversations:', remainingDMs.length);
  console.log('\nUnique DM conversations:');
  remainingDMs.forEach((dm: any) => {
    const participants = dm.data?.participants || [];
    console.log(`  - ${dm.data.title} (participants: ${participants.join(', ')})`);
  });
  
  process.exit(0);
}

cleanupDuplicateConversations().catch(console.error);