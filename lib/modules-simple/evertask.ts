import { db } from '@/lib/db'
import { entities } from '@/lib/db/schema'
import { eq, and, or, desc, asc, sql, isNull } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { activityService } from '@/lib/services/activity-service'

// Entity types for EverTask
export const TASK_ENTITY_TYPES = {
  PROJECT: 'project',
  TASK: 'task',
  TASK_COMMENT: 'task_comment',
  TASK_ATTACHMENT: 'task_attachment'
} as const

// Project status types
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
} as const

// Task status types
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  BLOCKED: 'blocked'
} as const

// Task priority types
export const TASK_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const

interface CreateProjectData {
  name: string
  description?: string
  privacy?: 'public' | 'private'
  team?: string
  osLink?: string
  useAI?: boolean
  views?: string[]
  dueDate?: Date
  members?: string[]
}

interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  status?: string
  priority?: string
  assigneeId?: string
  dueDate?: Date
  column?: string
  linkedEntities?: string[]
}

export class EverTaskService {
  // Create a new project
  async createProject(workspaceId: string, userId: string, data: CreateProjectData) {
    const projectId = uuidv4()
    
    const projectEntity = {
      id: projectId,
      workspaceId,
      userId,
      type: TASK_ENTITY_TYPES.PROJECT,
      data: {
        name: data.name,
        description: data.description || '',
        status: PROJECT_STATUS.ACTIVE,
        privacy: data.privacy || 'public',
        team: data.team || 'default',
        osLink: data.osLink || null,
        useAI: data.useAI || false,
        views: data.views || ['board', 'list', 'dashboard'],
        dueDate: data.dueDate?.toISOString() || null,
        members: data.members || [userId],
        progress: 0,
        tasksCount: 0,
        completedTasks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      relationships: data.osLink ? [{
        type: 'linked_to',
        targetId: data.osLink,
        metadata: { linkType: 'os_entity' }
      }] : [],
      metadata: {
        searchable: true,
        version: 1
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.insert(entities).values(projectEntity)
    return projectEntity
  }

  // Get all projects for a workspace
  async getProjects(workspaceId: string, userId?: string) {
    const conditions = [
      eq(entities.workspaceId, workspaceId),
      eq(entities.type, TASK_ENTITY_TYPES.PROJECT)
    ]

    // If userId is provided, filter to show only public projects or user's projects
    if (userId) {
      conditions.push(
        or(
          eq(entities.userId, userId),
          sql`data->>'privacy' = 'public'`
        )!
      )
    }

    const projects = await db
      .select()
      .from(entities)
      .where(and(...conditions))
      .orderBy(desc(entities.createdAt))

    return projects
  }

  // Get a single project
  async getProject(workspaceId: string, projectId: string) {
    const [project] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, projectId),
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.PROJECT)
        )
      )
      .limit(1)

    return project
  }

  // Create a task
  async createTask(workspaceId: string, userId: string, data: CreateTaskData) {
    const taskId = uuidv4()
    
    const taskEntity = {
      id: taskId,
      workspaceId,
      userId,
      type: TASK_ENTITY_TYPES.TASK,
      data: {
        title: data.title,
        description: data.description || '',
        status: data.status || TASK_STATUS.TODO,
        priority: data.priority || TASK_PRIORITY.MEDIUM,
        assigneeId: data.assigneeId || userId,
        dueDate: data.dueDate?.toISOString() || null,
        column: data.column || 'To Do',
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      relationships: [
        {
          type: 'belongs_to',
          targetId: data.projectId,
          metadata: { relationshipType: 'project_task' }
        },
        ...(data.linkedEntities || []).map(entityId => ({
          type: 'linked_to',
          targetId: entityId,
          metadata: { linkType: 'related_entity' }
        }))
      ],
      metadata: {
        searchable: true,
        version: 1
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.insert(entities).values(taskEntity)

    // Update project task count
    await this.updateProjectStats(workspaceId, data.projectId)
    
    // Log activity for linked entities
    if (data.linkedEntities && data.linkedEntities.length > 0) {
      for (const entityId of data.linkedEntities) {
        await activityService.logActivity(
          workspaceId,
          entityId,
          'task_created',
          'evertask',
          {
            taskId: taskId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            dueDate: data.dueDate,
            assignee: data.assigneeId
          },
          { userId }
        )
      }
    }

    return taskEntity
  }

  // Get tasks for a project
  async getProjectTasks(workspaceId: string, projectId: string) {
    try {
      const tasks = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, TASK_ENTITY_TYPES.TASK),
            sql`relationships @> ${JSON.stringify([{targetId: projectId}])}::jsonb`
          )
        )
        .orderBy(asc(entities.createdAt))

      return tasks
    } catch (error) {
      console.error('Error in getProjectTasks:', error)
      // Return empty array on error for now
      return []
    }
  }

  // Update task status
  async updateTaskStatus(workspaceId: string, taskId: string, status: string, column?: string) {
    const [task] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, taskId),
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK)
        )
      )
      .limit(1)

    if (!task) {
      throw new Error('Task not found')
    }

    const updatedData = {
      ...task.data,
      status,
      column: column || task.data.column,
      completedAt: status === TASK_STATUS.DONE ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }

    await db
      .update(entities)
      .set({
        data: updatedData,
        updatedAt: new Date()
      })
      .where(eq(entities.id, taskId))

    // Update project stats if task was completed/uncompleted
    const projectId = task.relationships?.find(r => r.type === 'belongs_to')?.targetId
    if (projectId) {
      await this.updateProjectStats(workspaceId, projectId)
    }
    
    // Log activity for linked entities
    const linkedEntities = task.relationships?.filter(r => r.type === 'linked_to')?.map(r => r.targetId) || []
    for (const entityId of linkedEntities) {
      await activityService.logActivity(
        workspaceId,
        entityId,
        status === TASK_STATUS.DONE ? 'task_completed' : 'task_updated',
        'evertask',
        {
          taskId: taskId,
          title: task.data.title,
          status: status,
          column: column,
          completedAt: updatedData.completedAt
        },
        { userId: task.userId || undefined }
      )
    }

    return { ...task, data: updatedData }
  }

  // Update task (general update)
  async updateTask(workspaceId: string, taskId: string, updates: any) {
    const [task] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, taskId),
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK)
        )
      )
      .limit(1)

    if (!task) {
      throw new Error('Task not found')
    }

    const updatedData = {
      ...task.data,
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString() : task.data.dueDate,
      updatedAt: new Date().toISOString()
    }

    await db
      .update(entities)
      .set({
        data: updatedData,
        updatedAt: new Date()
      })
      .where(eq(entities.id, taskId))

    return { ...task, data: updatedData }
  }

  // Delete task
  async deleteTask(workspaceId: string, taskId: string) {
    // First get the task to find its project
    const [task] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, taskId),
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK)
        )
      )
      .limit(1)
    
    if (!task) {
      throw new Error('Task not found')
    }

    // Delete the task by updating its type to mark it as deleted
    // Or we can use a deletedAt field, but for now let's change the type
    await db
      .update(entities)
      .set({
        type: 'deleted_task',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(entities.id, taskId),
          eq(entities.workspaceId, workspaceId)
        )
      )
    
    // Update project stats if task belonged to a project
    const projectId = task.relationships?.find(r => r.type === 'belongs_to')?.targetId
    if (projectId) {
      await this.updateProjectStats(workspaceId, projectId)
    }
  }
  
  // Update project statistics
  async updateProjectStats(workspaceId: string, projectId: string) {
    const tasks = await this.getProjectTasks(workspaceId, projectId)
    
    const tasksCount = tasks.length
    const completedTasks = tasks.filter(t => t.data.status === TASK_STATUS.DONE).length
    const progress = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0

    const [project] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, projectId),
          eq(entities.workspaceId, workspaceId)
        )
      )
      .limit(1)

    if (project) {
      const updatedData = {
        ...project.data,
        tasksCount,
        completedTasks,
        progress,
        updatedAt: new Date().toISOString()
      }

      await db
        .update(entities)
        .set({
          data: updatedData,
          updatedAt: new Date()
        })
        .where(eq(entities.id, projectId))
    }
  }

  // Get user's assigned tasks
  async getUserTasks(workspaceId: string, userId: string) {
    const tasks = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK),
          sql`data->>'assigneeId' = '${userId}'`
        )
      )
      .orderBy(asc(entities.createdAt))

    return tasks
  }

  // Get all tasks in workspace
  async getAllTasks(workspaceId: string) {
    const tasks = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK)
        )
      )
      .orderBy(desc(entities.createdAt))

    return tasks
  }

  // Get overdue tasks
  async getOverdueTasks(workspaceId: string) {
    const now = new Date().toISOString()
    
    const tasks = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK),
          sql`data->>'dueDate' < '${now}'`,
          sql`data->>'status' != '${TASK_STATUS.DONE}'`
        )
      )
      .orderBy(asc(entities.createdAt))

    return tasks
  }

  // Get projects at risk (projects with overdue tasks or behind schedule)
  async getProjectsAtRisk(workspaceId: string) {
    const overdueTasks = await this.getOverdueTasks(workspaceId)
    const projectIds = new Set(
      overdueTasks
        .map(t => t.relationships?.find(r => r.type === 'belongs_to')?.targetId)
        .filter(Boolean)
    )

    const projects = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.PROJECT),
          or(
            ...Array.from(projectIds).map(id => eq(entities.id, id as string))
          )!
        )
      )

    return projects
  }

  // Get team capacity (simplified - counts tasks per user)
  async getTeamCapacity(workspaceId: string) {
    const tasks = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK),
          sql`data->>'status' != '${TASK_STATUS.DONE}'`
        )
      )

    // Group by assignee
    const tasksByAssignee = tasks.reduce((acc, task) => {
      const assigneeId = task.data.assigneeId || 'unassigned'
      acc[assigneeId] = (acc[assigneeId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return tasksByAssignee
  }

  // Get overview statistics
  async getOverviewStats(workspaceId: string, userId: string) {
    const [
      projects,
      allTasks,
      userTasks,
      overdueTasks,
      projectsAtRisk,
      teamCapacity
    ] = await Promise.all([
      this.getProjects(workspaceId, userId),
      db.select().from(entities).where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, TASK_ENTITY_TYPES.TASK)
        )
      ),
      this.getUserTasks(workspaceId, userId),
      this.getOverdueTasks(workspaceId),
      this.getProjectsAtRisk(workspaceId),
      this.getTeamCapacity(workspaceId)
    ])

    const activeTasks = allTasks.filter(t => t.data.status !== TASK_STATUS.DONE)
    const tasksDueThisWeek = userTasks.filter(t => {
      if (!t.data.dueDate) return false
      const dueDate = new Date(t.data.dueDate)
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= now && dueDate <= nextWeek && t.data.status !== TASK_STATUS.DONE
    })

    // Calculate average capacity (simplified)
    const capacityValues = Object.values(teamCapacity)
    const avgCapacity = capacityValues.length > 0
      ? Math.round((capacityValues.reduce((a, b) => a + b, 0) / capacityValues.length) * 10)
      : 0

    return {
      projectsCount: projects.length,
      activeTasksCount: activeTasks.length,
      overdueTasksCount: overdueTasks.length,
      projectsAtRiskCount: projectsAtRisk.length,
      teamCapacityPercentage: Math.min(avgCapacity, 100),
      tasksDueThisWeek,
      projects,
      teamCapacity
    }
  }
}

export const everTaskService = new EverTaskService()