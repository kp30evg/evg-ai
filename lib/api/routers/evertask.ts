import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { everTaskService } from '@/lib/modules-simple/evertask'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const evertaskRouter = router({
  // Create a new project
  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      privacy: z.enum(['public', 'private']).optional(),
      team: z.string().optional(),
      osLink: z.string().optional(),
      useAI: z.boolean().optional(),
      views: z.array(z.string()).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      members: z.array(z.string()).optional(),
      budget: z.number().optional(),
      category: z.string().optional(),
      client: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.any()).optional(),
      template: z.string().optional(),
      milestones: z.array(z.object({
        name: z.string(),
        dueDate: z.string(),
        description: z.string().optional()
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('createProject called with input:', input)
        console.log('createProject ctx:', { userId: ctx.userId, orgId: ctx.orgId, workspace: ctx.workspace?.id })
        
        if (!ctx.workspace) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No workspace found'
          })
        }
        const workspaceId = ctx.workspace.id

        // Get the database user ID
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, ctx.userId))
          .limit(1)

        if (!dbUser) {
          console.error('User not found in database for clerkUserId:', ctx.userId)
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found in database'
          })
        }

        console.log('Creating project for dbUser:', dbUser.id)
        const project = await everTaskService.createProject(
          workspaceId,
          dbUser.id,
          {
            ...input,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            milestones: input.milestones?.map(m => ({
              ...m,
              dueDate: new Date(m.dueDate)
            }))
          }
        )

        console.log('Project created successfully:', project.id)
        return project
      } catch (error) {
        console.error('Error in createProject:', error)
        throw error
      }
    }),

  // Get all projects
  getProjects: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        console.log('getProjects ctx:', { userId: ctx.userId, orgId: ctx.orgId, workspace: ctx.workspace?.id })
        if (!ctx.workspace) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No workspace found'
          })
        }
        const workspaceId = ctx.workspace.id

        // Get the database user ID
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, ctx.userId))
          .limit(1)
        
        console.log('Found dbUser:', dbUser?.id)

        const projects = await everTaskService.getProjects(workspaceId, dbUser?.id)
        console.log('Found projects:', projects.length)
        return projects
      } catch (error) {
        console.error('Error in getProjects:', error)
        throw error
      }
    }),

  // Get a single project
  getProject: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const project = await everTaskService.getProject(workspaceId, input.projectId)
      return project
    }),
    
  // Update project
  updateProject: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      updates: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        privacy: z.enum(['public', 'private']).optional(),
        team: z.string().optional(),
        budget: z.number().optional(),
        category: z.string().optional(),
        client: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.any()).optional(),
        startDate: z.string().optional(),
        dueDate: z.string().optional(),
        members: z.array(z.string()).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const project = await everTaskService.updateProject(
        workspaceId,
        input.projectId,
        {
          ...input.updates,
          startDate: input.updates.startDate ? new Date(input.updates.startDate) : undefined,
          dueDate: input.updates.dueDate ? new Date(input.updates.dueDate) : undefined
        }
      )
      return project
    }),
    
  // Get project milestones
  getProjectMilestones: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const milestones = await everTaskService.getProjectMilestones(workspaceId, input.projectId)
      return milestones
    }),

  // Create a task
  createTask: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string().optional(),
      parentTaskId: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeId: z.string().optional(),
      dueDate: z.date().optional(),
      column: z.string().optional(),
      linkedEntities: z.array(z.string()).optional(),
      estimatedHours: z.number().optional(),
      tags: z.array(z.string()).optional(),
      dependencies: z.array(z.string()).optional(),
      customFields: z.record(z.any()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      // Get the database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1)

      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database'
        })
      }

      // If no project is specified, we need to create or find a default one
      let projectId = input.projectId
      if (!projectId) {
        // Create a default inbox project if needed
        const projects = await everTaskService.getProjects(workspaceId, dbUser.id)
        let inboxProject = projects.find(p => p.data?.name === 'Inbox')
        
        if (!inboxProject) {
          inboxProject = await everTaskService.createProject(workspaceId, dbUser.id, {
            name: 'Inbox',
            description: 'Default project for standalone tasks',
            privacy: 'private'
          })
        }
        projectId = inboxProject.id
      }

      const task = await everTaskService.createTask(
        workspaceId,
        dbUser.id,
        {
          ...input,
          projectId,
          dueDate: input.dueDate
        }
      )

      return task
    }),

  // Get tasks for a project
  getProjectTasks: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const tasks = await everTaskService.getProjectTasks(workspaceId, input.projectId)
      return tasks
    }),

  // Update task status
  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.string(),
      column: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const task = await everTaskService.updateTaskStatus(
        workspaceId,
        input.taskId,
        input.status,
        input.column
      )

      return task
    }),

  // Update task (general update including assignee)
  updateTask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      updates: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigneeId: z.string().optional(),
        dueDate: z.string().optional(),
        tags: z.array(z.string()).optional(),
        column: z.string().optional(),
        linkedEntities: z.array(z.string()).optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const task = await everTaskService.updateTask(
        workspaceId,
        input.taskId,
        input.updates
      )

      return task
    }),
  
  // Delete task
  deleteTask: protectedProcedure
    .input(z.object({
      taskId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      await everTaskService.deleteTask(workspaceId, input.taskId)
      
      return { success: true }
    }),

  // Get user's tasks
  getUserTasks: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      // Get the database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1)

      if (!dbUser) {
        return []
      }

      const tasks = await everTaskService.getUserTasks(workspaceId, dbUser.id)
      return tasks
    }),

  // Get all tasks in workspace
  getAllTasks: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const tasks = await everTaskService.getAllTasks(workspaceId)
      return tasks
    }),

  // Get subtasks for a task
  getSubtasks: protectedProcedure
    .input(z.object({
      parentTaskId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const subtasks = await everTaskService.getSubtasks(workspaceId, input.parentTaskId)
      return subtasks
    }),
    
  // Get task dependencies
  getTaskDependencies: protectedProcedure
    .input(z.object({
      taskId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      const dependencies = await everTaskService.getTaskDependencies(workspaceId, input.taskId)
      return dependencies
    }),
  
  // Get overview statistics
  getOverviewStats: protectedProcedure
    .input(z.object({
      userId: z.string().optional()
    }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No workspace found'
        })
      }
      const workspaceId = ctx.workspace.id

      // Get the database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1)

      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database'
        })
      }

      const stats = await everTaskService.getOverviewStats(workspaceId, dbUser.id)
      return stats
    })
})