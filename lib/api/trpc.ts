import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import type { User, Company } from '@/lib/db';

export const createContext = async () => {
  const { userId, orgId } = await auth();

  // Get user and company from database if authenticated
  let user: User | null = null;
  let company: Company | null = null;

  if (userId && orgId) {
    const results = await Promise.all([
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkUserId, userId),
      }),
      db.query.companies.findFirst({
        where: (companies, { eq }) => eq(companies.clerkOrgId, orgId),
      }),
    ]);
    
    user = results[0] || null;
    company = results[1] || null;
  }

  return {
    userId,
    orgId,
    user,
    company,
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
      company: ctx.company,
    },
  });
});