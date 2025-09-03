import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, users } from '@/lib/db/schema/unified'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type
  
  if (eventType === 'organization.created') {
    const { id, name, slug } = evt.data
    
    try {
      // Create company record
      await db.insert(companies).values({
        clerkOrgId: id,
        name: name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        onboardingCompleted: false,
        onboardingStep: 0,
        connectedIntegrations: []
      })
      
      console.log(`Organization created: ${name} (${id})`)
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }
  
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    
    try {
      // Check if user already exists
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkUserId, id))
        .limit(1)
      
      if (!existingUser) {
        // Create user record (without company initially)
        await db.insert(users).values({
          clerkUserId: id,
          email: email_addresses[0]?.email_address || '',
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
          workspaceId: null, // Will be set when they join an organization
          hasCompletedTour: false,
          firstCommandExecuted: false,
          role: 'member'
        })
        
        console.log(`User created: ${email_addresses[0]?.email_address}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }
  
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    
    try {
      // Update user record
      await db
        .update(users)
        .set({
          email: email_addresses[0]?.email_address || '',
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
          updatedAt: new Date()
        })
        .where(eq(users.clerkUserId, id))
      
      console.log(`User updated: ${email_addresses[0]?.email_address}`)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }
  
  if (eventType === 'organizationMembership.created') {
    const { organization, public_user_data } = evt.data
    
    try {
      // Check if company exists
      const [company] = await db
        .select({ id: workspaces.id })
        .from(companies)
        .where(eq(workspaces.clerkOrgId, organization.id))
        .limit(1)
      
      if (company) {
        // Check if user exists
        const [existingUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.clerkUserId, public_user_data.user_id))
          .limit(1)
        
        if (existingUser) {
          // Update user with company association
          await db
            .update(users)
            .set({
              workspaceId: company.id,
              updatedAt: new Date()
            })
            .where(eq(users.clerkUserId, public_user_data.user_id))
          
          console.log(`User ${public_user_data.identifier} linked to organization ${organization.name}`)
        } else {
          // Create user record if it doesn't exist
          await db.insert(users).values({
            clerkUserId: public_user_data.user_id,
            email: public_user_data.identifier || '',
            firstName: public_user_data.first_name,
            lastName: public_user_data.last_name,
            imageUrl: public_user_data.image_url,
            workspaceId: company.id,
            hasCompletedTour: false,
            firstCommandExecuted: false,
            role: 'member'
          })
          
          console.log(`User created and added to organization: ${public_user_data.identifier}`)
        }
      }
    } catch (error) {
      console.error('Error adding user to organization:', error)
    }
  }

  return new Response('', { status: 200 })
}