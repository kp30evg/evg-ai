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
      dueDate: z.string().optional(),
      members: z.array(z.string()).optional()
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
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined
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

  // Create a task
  createTask: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeId: z.string().optional(),
      dueDate: z.string().optional(),
      column: z.string().optional(),
      linkedEntities: z.array(z.string()).optional()
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

      const task = await everTaskService.createTask(
        workspaceId,
        dbUser.id,
        {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined
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

  // Get overview statistics
  getOverviewStats: protectedProcedure
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database'
        })
      }

      const stats = await everTaskService.getOverviewStats(workspaceId, dbUser.id)
      return stats
    })
})