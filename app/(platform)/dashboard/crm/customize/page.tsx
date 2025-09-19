'use client'

import WorkspaceCustomizer from '@/components/evercore/workspace/WorkspaceCustomizer'
import CRMWrapper from '@/components/evercore/CRMWrapper'

export default function CustomizePage() {
  return (
    <CRMWrapper>
      <WorkspaceCustomizer />
    </CRMWrapper>
  )
}