import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import type { User, Workspace } from '@/lib/db';

export const createContext = async () => {
  const { userId, orgId } = await auth();

  // Get user and workspace from database if authenticated
  let user: User | null = null;
  let workspace: Workspace | null = null;

  if (userId && orgId) {
    const results = await Promise.all([
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkUserId, userId),
      }),
      db.query.workspaces.findFirst({
        where: (workspaces, { eq }) => eq(workspaces.clerkOrgId, orgId),
      }),
    ]);
    
    user = results[0] || null;
    workspace = results[1] || null;
  }

  return {
    userId,
    orgId,
    user,
    workspace,
    company: workspace, // Add alias for backwards compatibility
    db,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.orgId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      orgId: ctx.orgId,
      organizationId: ctx.orgId, // Add alias for compatibility
      user: ctx.user,
      workspace: ctx.workspace,
      company: ctx.company, // Alias for workspace
    },
  });
});