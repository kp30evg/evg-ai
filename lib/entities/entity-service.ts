/**
 * EntityService - The ONLY service needed for ALL data operations
 * This replaces complex module systems with simple, direct entity manipulation
 */

import { db } from '@/lib/db';
import { entities, Entity, NewEntity } from '@/lib/db/schema/unified';
import { eq, and, or, sql, desc, asc, like, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface EntityQuery {
  workspaceId: string;
  userId?: string; // Add userId to query interface
  type?: string | string[];
  where?: Record<string, any>;
  relationships?: Record<string, string>;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
  search?: string;
}

export interface EntityRelationship {
  id: string;
  type: string;
  metadata?: Record<string, any>;
}

export class EntityService {
  /**
   * Create a new entity
   */
  async create(
    workspaceId: string,
    type: string,
    data: any,
    relationships: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ): Promise<Entity> {
    const searchText = this.extractSearchableText(data);
    
    // Only set userId if it's a valid UUID (database user ID)
    // Clerk IDs start with "user_" so we can detect them
    const dbUserId = metadata.userId && !metadata.userId.startsWith('user_') 
      ? metadata.userId 
      : null;
    
    const [entity] = await db.insert(entities).values({
      workspaceId,
      userId: dbUserId, // Only use valid database user IDs
      type,
      data,
      relationships,
      metadata: {
        ...metadata,
        version: 1,
        createdBy: metadata.createdBy || metadata.userId || 'system', // Store Clerk ID in metadata
      },
      searchVector: searchText,
    }).returning();

    return entity;
  }

  /**
   * Find entities with flexible querying
   */
  async find(query: EntityQuery): Promise<Entity[]> {
    let baseQuery = db.select().from(entities);
    const conditions = [];

    // Workspace filter (required)
    conditions.push(eq(entities.workspaceId, query.workspaceId));
    
    // User filter (if provided)
    if (query.userId) {
      conditions.push(eq(entities.userId, query.userId));
    }

    // Type filter
    if (query.type) {
      if (Array.isArray(query.type)) {
        conditions.push(or(...query.type.map(t => eq(entities.type, t))));
      } else {
        conditions.push(eq(entities.type, query.type));
      }
    }

    // Search filter
    if (query.search) {
      conditions.push(
        or(
          ilike(entities.searchVector, `%${query.search}%`),
          sql`${entities.data}::text ILIKE ${`%${query.search}%`}`
        )
      );
    }

    // Data field filters
    if (query.where) {
      for (const [key, value] of Object.entries(query.where)) {
        if (value !== undefined) {
          conditions.push(sql`${entities.data}->>${key} = ${value}`);
        }
      }
    }

    // Relationship filters
    if (query.relationships) {
      for (const [relType, entityId] of Object.entries(query.relationships)) {
        conditions.push(
          sql`${entities.relationships}->>${relType} = ${entityId}`
        );
      }
    }

    // Apply all conditions
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Ordering
    const orderCol = query.orderBy === 'updatedAt' ? entities.updatedAt : entities.createdAt;
    const orderFn = query.orderDirection === 'asc' ? asc : desc;
    baseQuery = baseQuery.orderBy(orderFn(orderCol));

    // Pagination
    if (query.limit) {
      baseQuery = baseQuery.limit(query.limit);
    }
    if (query.offset) {
      baseQuery = baseQuery.offset(query.offset);
    }

    return await baseQuery;
  }

  /**
   * Find a single entity by ID
   */
  async findById(workspaceId: string, id: string): Promise<Entity | null> {
    const [entity] = await db
      .select()
      .from(entities)
      .where(and(
        eq(entities.id, id),
        eq(entities.workspaceId, workspaceId)
      ))
      .limit(1);

    return entity || null;
  }

  /**
   * Update an entity
   */
  async update(
    workspaceId: string,
    id: string,
    data?: Partial<any>,
    relationships?: Partial<any>,
    metadata?: Partial<any>
  ): Promise<Entity> {
    const updates: any = {
      updatedAt: new Date(),
    };

    if (data !== undefined) {
      updates.data = sql`${entities.data} || ${JSON.stringify(data)}::jsonb`;
      updates.searchVector = this.extractSearchableText(data);
    }

    if (relationships !== undefined) {
      updates.relationships = sql`${entities.relationships} || ${JSON.stringify(relationships)}::jsonb`;
    }

    if (metadata !== undefined) {
      updates.metadata = sql`COALESCE(${entities.metadata}, '{}'::jsonb) || ${JSON.stringify({
        ...metadata,
        version: sql`COALESCE((${entities.metadata}->>'version')::int, 0) + 1`,
      })}::jsonb`;
    }

    const [entity] = await db
      .update(entities)
      .set(updates)
      .where(and(
        eq(entities.id, id),
        eq(entities.workspaceId, workspaceId)
      ))
      .returning();

    return entity;
  }

  /**
   * Delete an entity
   */
  async delete(workspaceId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(entities)
      .where(and(
        eq(entities.id, id),
        eq(entities.workspaceId, workspaceId)
      ))
      .returning();

    return result.length > 0;
  }

  /**
   * Link two entities together
   */
  async link(
    workspaceId: string,
    entity1Id: string,
    entity2Id: string,
    relationshipType: string,
    bidirectional = true
  ): Promise<void> {
    // Update entity1 with relationship to entity2
    const entity1 = await this.findById(workspaceId, entity1Id);
    if (!entity1) throw new Error(`Entity ${entity1Id} not found`);

    const relationships1 = entity1.relationships || {};
    if (!relationships1[relationshipType]) {
      relationships1[relationshipType] = [];
    }
    if (!Array.isArray(relationships1[relationshipType])) {
      relationships1[relationshipType] = [relationships1[relationshipType]];
    }
    if (!relationships1[relationshipType].includes(entity2Id)) {
      relationships1[relationshipType].push(entity2Id);
    }

    await this.update(workspaceId, entity1Id, undefined, relationships1);

    // If bidirectional, also update entity2
    if (bidirectional) {
      const entity2 = await this.findById(workspaceId, entity2Id);
      if (!entity2) throw new Error(`Entity ${entity2Id} not found`);

      const relationships2 = entity2.relationships || {};
      const reverseType = `reverse_${relationshipType}`;
      if (!relationships2[reverseType]) {
        relationships2[reverseType] = [];
      }
      if (!Array.isArray(relationships2[reverseType])) {
        relationships2[reverseType] = [relationships2[reverseType]];
      }
      if (!relationships2[reverseType].includes(entity1Id)) {
        relationships2[reverseType].push(entity1Id);
      }

      await this.update(workspaceId, entity2Id, undefined, relationships2);
    }
  }

  /**
   * Unlink two entities
   */
  async unlink(
    workspaceId: string,
    entity1Id: string,
    entity2Id: string,
    relationshipType: string,
    bidirectional = true
  ): Promise<void> {
    // Remove relationship from entity1
    const entity1 = await this.findById(workspaceId, entity1Id);
    if (entity1 && entity1.relationships) {
      const relationships1 = { ...entity1.relationships };
      if (relationships1[relationshipType]) {
        if (Array.isArray(relationships1[relationshipType])) {
          relationships1[relationshipType] = relationships1[relationshipType].filter(
            (id: string) => id !== entity2Id
          );
        } else if (relationships1[relationshipType] === entity2Id) {
          delete relationships1[relationshipType];
        }
      }
      await this.update(workspaceId, entity1Id, undefined, relationships1);
    }

    // If bidirectional, also remove from entity2
    if (bidirectional) {
      const entity2 = await this.findById(workspaceId, entity2Id);
      if (entity2 && entity2.relationships) {
        const relationships2 = { ...entity2.relationships };
        const reverseType = `reverse_${relationshipType}`;
        if (relationships2[reverseType]) {
          if (Array.isArray(relationships2[reverseType])) {
            relationships2[reverseType] = relationships2[reverseType].filter(
              (id: string) => id !== entity1Id
            );
          } else if (relationships2[reverseType] === entity1Id) {
            delete relationships2[reverseType];
          }
        }
        await this.update(workspaceId, entity2Id, undefined, relationships2);
      }
    }
  }

  /**
   * Find all entities related to a given entity
   */
  async findRelated(
    workspaceId: string,
    entityId: string,
    relationshipType?: string
  ): Promise<Entity[]> {
    const entity = await this.findById(workspaceId, entityId);
    if (!entity || !entity.relationships) return [];

    const relatedIds: string[] = [];
    
    if (relationshipType) {
      // Get specific relationship type
      const related = entity.relationships[relationshipType];
      if (related) {
        if (Array.isArray(related)) {
          relatedIds.push(...related);
        } else {
          relatedIds.push(related);
        }
      }
    } else {
      // Get all related entities
      for (const [_, value] of Object.entries(entity.relationships)) {
        if (Array.isArray(value)) {
          relatedIds.push(...value);
        } else if (typeof value === 'string') {
          relatedIds.push(value);
        }
      }
    }

    if (relatedIds.length === 0) return [];

    // Fetch all related entities
    return await db
      .select()
      .from(entities)
      .where(and(
        eq(entities.workspaceId, workspaceId),
        or(...relatedIds.map(id => eq(entities.id, id)))
      ));
  }

  /**
   * Execute a natural language query across all entities
   */
  async naturalLanguageQuery(
    workspaceId: string,
    query: string
  ): Promise<any> {
    // Parse the query to understand intent
    const lowerQuery = query.toLowerCase();
    
    // Example patterns (in production, use AI for better parsing)
    if (lowerQuery.includes('show') || lowerQuery.includes('get') || lowerQuery.includes('list')) {
      // Extract entity type
      const types = ['customer', 'message', 'task', 'invoice', 'email', 'conversation'];
      const matchedType = types.find(t => lowerQuery.includes(t));
      
      if (matchedType) {
        return await this.find({
          workspaceId,
          type: matchedType,
          limit: 50,
        });
      }
    }

    if (lowerQuery.includes('everything about') || lowerQuery.includes('all about')) {
      // Extract entity name or ID
      const match = query.match(/about\s+(.+)/i);
      if (match) {
        const searchTerm = match[1].trim();
        
        // Find all entities that mention this term
        return await this.find({
          workspaceId,
          search: searchTerm,
          limit: 100,
        });
      }
    }

    // Default: search all entities
    return await this.find({
      workspaceId,
      search: query,
      limit: 50,
    });
  }

  /**
   * Helper: Extract searchable text from entity data
   */
  private extractSearchableText(data: any): string {
    const texts: string[] = [];
    
    const extract = (obj: any): void => {
      if (typeof obj === 'string') {
        texts.push(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        for (const value of Object.values(obj)) {
          extract(value);
        }
      }
    };
    
    extract(data);
    return texts.join(' ');
  }

  /**
   * Batch operations for performance
   */
  async createMany(
    workspaceId: string,
    entities: Array<{
      type: string;
      data: any;
      relationships?: Record<string, any>;
      metadata?: Record<string, any>;
    }>
  ): Promise<Entity[]> {
    const values = entities.map(e => ({
      workspaceId,
      type: e.type,
      data: e.data,
      relationships: e.relationships || {},
      metadata: e.metadata || {},
      searchVector: this.extractSearchableText(e.data),
    }));

    return await db.insert(entities).values(values).returning();
  }

  /**
   * Count entities matching criteria
   */
  async count(query: Omit<EntityQuery, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>): Promise<number> {
    const results = await this.find({ ...query, limit: undefined, offset: undefined });
    return results.length;
  }
}

// Export singleton instance
export const entityService = new EntityService();