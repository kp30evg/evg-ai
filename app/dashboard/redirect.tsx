'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'

export function OnboardingRedirect() {
  const router = useRouter()
  const { organization, isLoaded } = useOrganization()

  useEffect(() => {
    if (isLoaded && organization) {
      // Check if this is a new org (you can add more sophisticated logic here)
      // For now, check localStorage for a simple flag
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${organization.id}`)
      
      if (!hasCompletedOnboarding) {
        router.push('/onboarding')
      }
    }
  }, [isLoaded, organization, router])

  return null
}