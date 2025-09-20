import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { clerkClient } from '@clerk/nextjs/server'

export const organizationRouter = router({
  // Get organization members
  getMembers: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.orgId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No organization found'
        })
      }

      try {
        // Get all organization members from Clerk
        const clerk = await clerkClient()
        const memberships = await clerk.organizations.getOrganizationMembershipList({
          organizationId: ctx.orgId,
          limit: 100
        })

        // Transform to a simpler format
        const members = await Promise.all(memberships.data.map(async (membership) => {
          const user = await clerk.users.getUser(membership.publicUserData?.userId || '')
          return {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Unknown',
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            role: membership.role
          }
        }))

        return members
      } catch (error) {
        console.error('Failed to fetch organization members:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch organization members'
        })
      }
    }),

  // Get current user's info
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        })
      }

      try {
        const clerk = await clerkClient()
        const user = await clerk.users.getUser(ctx.userId)
        return {
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Unknown',
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user info'
        })
      }
    })
})