/**
 * CRITICAL SECURITY WRAPPER
 * This ensures ALL queries include proper user isolation
 * NEVER query entities directly without this wrapper
 */

import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { and, eq, SQL } from 'drizzle-orm';

interface SecureQueryContext {
  workspaceId: string;
  userId: string;
  type: string;
}

/**
 * ALWAYS use this for querying user data
 * It enforces workspace and user isolation automatically
 */
export function createSecureQuery(context: SecureQueryContext) {
  // These conditions are ALWAYS applied - no exceptions
  const mandatoryConditions: SQL[] = [
    eq(entities.workspaceId, context.workspaceId),
    eq(entities.type, context.type),
    eq(entities.userId, context.userId)
  ];

  return {
    /**
     * Add additional conditions while preserving security filters
     */
    where: (...additionalConditions: SQL[]) => {
      // CRITICAL: Mandatory conditions always come first and cannot be overridden
      const allConditions = [...mandatoryConditions, ...additionalConditions];
      
      return db
        .select()
        .from(entities)
        .where(and(...allConditions));
    },

    /**
     * Get the base query with only security filters
     */
    baseQuery: () => {
      return db
        .select()
        .from(entities)
        .where(and(...mandatoryConditions));
    },

    /**
     * Verify that a result belongs to the user (fail-safe check)
     */
    verifyResult: (result: any) => {
      if (!result) return true;
      
      if (result.userId !== context.userId) {
        console.error('❌ SECURITY VIOLATION: Result does not belong to user!');
        console.error('Expected userId:', context.userId);
        console.error('Got userId:', result.userId);
        throw new Error('Security violation: Attempted to access another user\'s data');
      }
      
      if (result.workspaceId !== context.workspaceId) {
        console.error('❌ SECURITY VIOLATION: Result does not belong to workspace!');
        throw new Error('Security violation: Attempted to access another workspace\'s data');
      }
      
      return true;
    },

    /**
     * Filter results to ensure they belong to the user (emergency fail-safe)
     */
    filterResults: (results: any[]) => {
      const safeResults = results.filter(r => 
        r.userId === context.userId && 
        r.workspaceId === context.workspaceId
      );
      
      if (safeResults.length !== results.length) {
        console.error('❌ SECURITY WARNING: Filtered out', results.length - safeResults.length, 'results that didn\'t belong to user');
      }
      
      return safeResults;
    }
  };
}

/**
 * Quick helper for common email queries
 */
export function createEmailQuery(workspaceId: string, userId: string) {
  return createSecureQuery({
    workspaceId,
    userId,
    type: 'email'
  });
}