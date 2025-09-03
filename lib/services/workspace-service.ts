/**
 * Workspace Service - Handles mapping between Clerk org IDs and workspace UUIDs
 */

import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

export class WorkspaceService {
  /**
   * Get workspace UUID from Clerk org ID
   */
  async getWorkspaceIdFromClerkOrg(clerkOrgId: string): Promise<string | null> {
    try {
      const workspace = await db.select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.clerkOrgId, clerkOrgId))
        .limit(1);

      return workspace[0]?.id || null;
    } catch (error) {
      console.error('Error getting workspace ID:', error);
      return null;
    }
  }

  /**
   * Create workspace if it doesn't exist
   */
  async createWorkspaceIfNotExists(clerkOrgId: string, name: string): Promise<string> {
    try {
      // Try to get existing workspace
      let workspaceId = await this.getWorkspaceIdFromClerkOrg(clerkOrgId);
      
      if (workspaceId) {
        return workspaceId;
      }

      // Create new workspace
      const [newWorkspace] = await db.insert(workspaces).values({
        clerkOrgId,
        name,
        slug: clerkOrgId.toLowerCase().replace(/[^a-z0-9]/g, '-')
      }).returning({ id: workspaces.id });

      return newWorkspace.id;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }
}

export const workspaceService = new WorkspaceService();