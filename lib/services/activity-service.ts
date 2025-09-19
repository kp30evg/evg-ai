/**
 * ActivityService - Comprehensive activity tracking and timeline management
 * Handles all activity logging, timeline aggregation, and cross-module activity tracking
 */

import { db } from '@/lib/db';
import { 
  activities, 
  Activity, 
  entities,
  Entity,
  users,
  User
} from '@/lib/db/schema/unified';
import { eq, and, or, sql, desc, asc, inArray } from 'drizzle-orm';
import { entityService } from '@/lib/entities/entity-service';

export interface ActivityEvent {
  id: string;
  type: string;
  module: string;
  timestamp: Date;
  title: string;
  description?: string;
  entityId?: string;
  entityName?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  participants?: {
    id: string;
    name: string;
    email?: string;
  }[];
  metadata?: Record<string, any>;
  icon?: string;
  color?: string;
}

export interface ActivityFilters {
  types?: string[];
  modules?: string[];
  entities?: string[];
  users?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivitySummary {
  totalActivities: number;
  byType: Record<string, number>;
  byModule: Record<string, number>;
  byUser: Record<string, number>;
  recentActivities: ActivityEvent[];
  topEntities: {
    entityId: string;
    entityName: string;
    activityCount: number;
  }[];
}

export class ActivityService {
  /**
   * Log a new activity
   */
  async logActivity(
    workspaceId: string,
    entityId: string,
    type: string,
    module: string,
    content: any = {},
    options: {
      userId?: string;
      participants?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Activity> {
    return await entityService.logActivity(
      workspaceId,
      entityId,
      type,
      content,
      {
        ...options,
        sourceModule: module
      }
    );
  }

  /**
   * Get timeline for an entity
   */
  async getEntityTimeline(
    workspaceId: string,
    entityId: string,
    filters: ActivityFilters = {}
  ): Promise<ActivityEvent[]> {
    const activities = await entityService.getActivities(
      workspaceId,
      entityId,
      {
        limit: filters.limit || 50,
        offset: filters.offset,
        types: filters.types,
        startDate: filters.startDate,
        endDate: filters.endDate
      }
    );

    return await this.formatActivities(workspaceId, activities);
  }

  /**
   * Get global activity timeline
   */
  async getGlobalTimeline(
    workspaceId: string,
    filters: ActivityFilters = {}
  ): Promise<ActivityEvent[]> {
    let query = db
      .select()
      .from(activities)
      .where(eq(activities.workspaceId, workspaceId))
      .orderBy(desc(activities.timestamp));

    // Apply filters
    const conditions = [eq(activities.workspaceId, workspaceId)];

    if (filters.types && filters.types.length > 0) {
      conditions.push(inArray(activities.activityType, filters.types));
    }

    if (filters.modules && filters.modules.length > 0) {
      conditions.push(inArray(activities.sourceModule, filters.modules));
    }

    if (filters.entities && filters.entities.length > 0) {
      conditions.push(inArray(activities.entityId, filters.entities));
    }

    if (filters.users && filters.users.length > 0) {
      conditions.push(inArray(activities.userId, filters.users));
    }

    if (filters.startDate) {
      conditions.push(sql`${activities.timestamp} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${activities.timestamp} <= ${filters.endDate}`);
    }

    query = query.where(and(...conditions));

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;
    return await this.formatActivities(workspaceId, results);
  }

  /**
   * Get activity summary for an entity
   */
  async getActivitySummary(
    workspaceId: string,
    entityId?: string,
    days: number = 30
  ): Promise<ActivitySummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const conditions = [
      eq(activities.workspaceId, workspaceId),
      sql`${activities.timestamp} >= ${startDate}`
    ];

    if (entityId) {
      conditions.push(eq(activities.entityId, entityId));
    }

    // Get all activities in date range
    const allActivities = await db
      .select()
      .from(activities)
      .where(and(...conditions));

    // Calculate summaries
    const byType: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    allActivities.forEach(activity => {
      // Count by type
      byType[activity.activityType] = (byType[activity.activityType] || 0) + 1;

      // Count by module
      if (activity.sourceModule) {
        byModule[activity.sourceModule] = (byModule[activity.sourceModule] || 0) + 1;
      }

      // Count by user
      if (activity.userId) {
        byUser[activity.userId] = (byUser[activity.userId] || 0) + 1;
      }

      // Count by entity
      if (activity.entityId) {
        entityCounts[activity.entityId] = (entityCounts[activity.entityId] || 0) + 1;
      }
    });

    // Get top entities
    const topEntityIds = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topEntities = await Promise.all(
      topEntityIds.map(async (id) => {
        const entity = await entityService.findById(workspaceId, id);
        return {
          entityId: id,
          entityName: entity?.data?.name || entity?.data?.title || 'Unknown',
          activityCount: entityCounts[id]
        };
      })
    );

    // Get recent activities
    const recentActivities = await this.getGlobalTimeline(workspaceId, {
      limit: 10
    });

    return {
      totalActivities: allActivities.length,
      byType,
      byModule,
      byUser,
      recentActivities,
      topEntities
    };
  }

  /**
   * Format activities into ActivityEvent format
   */
  private async formatActivities(
    workspaceId: string,
    activities: Activity[]
  ): Promise<ActivityEvent[]> {
    const events: ActivityEvent[] = [];

    for (const activity of activities) {
      let entity: Entity | null = null;
      let user: User | null = null;

      // Fetch related entity
      if (activity.entityId) {
        entity = await entityService.findById(workspaceId, activity.entityId);
      }

      // Fetch user info
      if (activity.userId) {
        const [userData] = await db
          .select()
          .from(users)
          .where(eq(users.id, activity.userId))
          .limit(1);
        user = userData;
      }

      // Format participants
      let participants: ActivityEvent['participants'] = [];
      if (activity.participants && activity.participants.length > 0) {
        const participantUsers = await db
          .select()
          .from(users)
          .where(inArray(users.id, activity.participants));
        
        participants = participantUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim() || u.email,
          email: u.email
        }));
      }

      // Determine icon and color based on activity type
      const { icon, color } = this.getActivityStyle(activity.activityType, activity.sourceModule);

      events.push({
        id: activity.id,
        type: activity.activityType,
        module: activity.sourceModule || 'system',
        timestamp: activity.timestamp,
        title: this.generateActivityTitle(activity, entity),
        description: activity.content?.description || activity.content?.message,
        entityId: activity.entityId,
        entityName: entity?.data?.name || entity?.data?.title,
        entityType: entity?.type,
        userId: activity.userId,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : undefined,
        participants,
        metadata: activity.metadata,
        icon,
        color
      });
    }

    return events;
  }

  /**
   * Generate human-readable activity title
   */
  private generateActivityTitle(activity: Activity, entity: Entity | null): string {
    const entityName = entity?.data?.name || entity?.data?.title || 'entity';
    
    // Map activity types to human-readable titles
    const titleMap: Record<string, string> = {
      'email_sent': `Email sent to ${entityName}`,
      'email_received': `Email received from ${entityName}`,
      'call_made': `Called ${entityName}`,
      'call_received': `Received call from ${entityName}`,
      'meeting_scheduled': `Meeting scheduled with ${entityName}`,
      'meeting_held': `Meeting held with ${entityName}`,
      'note_added': `Note added to ${entityName}`,
      'deal_created': `Deal created for ${entityName}`,
      'deal_updated': `Deal updated for ${entityName}`,
      'deal_stage_changed': `Deal stage changed for ${entityName}`,
      'task_created': `Task created for ${entityName}`,
      'task_completed': `Task completed for ${entityName}`,
      'contact_created': `Contact created: ${entityName}`,
      'company_created': `Company created: ${entityName}`,
      'document_shared': `Document shared with ${entityName}`,
      'invoice_sent': `Invoice sent to ${entityName}`,
      'payment_received': `Payment received from ${entityName}`,
    };

    return titleMap[activity.activityType] || `${activity.activityType} for ${entityName}`;
  }

  /**
   * Get activity style (icon and color) based on type
   */
  private getActivityStyle(type: string, module?: string): { icon: string; color: string } {
    // Module-specific styles
    if (module) {
      const moduleStyles: Record<string, { icon: string; color: string }> = {
        'evermail': { icon: 'Mail', color: '#0EA5E9' },
        'everchat': { icon: 'MessageSquare', color: '#8B5CF6' },
        'evercal': { icon: 'Calendar', color: '#F59E0B' },
        'evercore': { icon: 'Target', color: '#10B981' },
        'everdocs': { icon: 'FileText', color: '#6366F1' },
        'everinvoice': { icon: 'DollarSign', color: '#EC4899' },
      };

      if (moduleStyles[module]) {
        return moduleStyles[module];
      }
    }

    // Type-specific styles
    const typeStyles: Record<string, { icon: string; color: string }> = {
      'email': { icon: 'Mail', color: '#0EA5E9' },
      'call': { icon: 'Phone', color: '#10B981' },
      'meeting': { icon: 'Calendar', color: '#F59E0B' },
      'note': { icon: 'StickyNote', color: '#6366F1' },
      'deal': { icon: 'Target', color: '#10B981' },
      'task': { icon: 'CheckSquare', color: '#8B5CF6' },
      'document': { icon: 'FileText', color: '#6366F1' },
      'invoice': { icon: 'Receipt', color: '#EC4899' },
      'payment': { icon: 'DollarSign', color: '#10B981' },
    };

    // Check if type starts with any known prefix
    for (const [prefix, style] of Object.entries(typeStyles)) {
      if (type.startsWith(prefix)) {
        return style;
      }
    }

    // Default style
    return { icon: 'Activity', color: '#6B7280' };
  }

  /**
   * Bulk log activities
   */
  async bulkLogActivities(
    workspaceId: string,
    activities: {
      entityId: string;
      type: string;
      module: string;
      content?: any;
      userId?: string;
      participants?: string[];
      metadata?: Record<string, any>;
    }[]
  ): Promise<Activity[]> {
    const values = activities.map(activity => ({
      workspaceId,
      entityId: activity.entityId,
      activityType: activity.type,
      sourceModule: activity.module,
      content: activity.content || {},
      userId: activity.userId,
      participants: activity.participants,
      metadata: activity.metadata || {},
      timestamp: new Date(),
    }));

    return await db.insert(activities).values(values).returning();
  }
}

// Export singleton instance
export const activityService = new ActivityService();